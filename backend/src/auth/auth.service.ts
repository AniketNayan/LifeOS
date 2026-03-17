import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import { Response, Request, type CookieOptions } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthRateLimitService } from './auth-rate-limit.service';

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
};

@Injectable()
export class AuthService {
  private readonly jwtAccessSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authRateLimitService: AuthRateLimitService,
  ) {
    this.jwtAccessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'default-access-secret';
    this.jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret';

    if (!this.jwtAccessSecret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is required');
    }
    if (!this.jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
  }

  async register(req: Request, dto: RegisterDto, res: Response) {
    const email = dto.email.trim().toLowerCase();
    const rateLimitKey = this.getRateLimitKey('register', req, email);
    this.authRateLimitService.check(rateLimitKey, 5, 15 * 60 * 1000);

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      this.authRateLimitService.recordFailure(rateLimitKey, 15 * 60 * 1000);
      throw new BadRequestException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
      },
    });

    this.authRateLimitService.clear(rateLimitKey);
    return this.finishLogin(user, res);
  }

  async login(req: Request, dto: LoginDto, res: Response) {
    const email = dto.email.trim().toLowerCase();
    const rateLimitKey = this.getRateLimitKey('login', req, email);
    this.authRateLimitService.check(rateLimitKey, 8, 15 * 60 * 1000);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash) {
      this.authRateLimitService.recordFailure(rateLimitKey, 15 * 60 * 1000);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      this.authRateLimitService.recordFailure(rateLimitKey, 15 * 60 * 1000);
      throw new UnauthorizedException('Invalid email or password.');
    }

    this.authRateLimitService.clear(rateLimitKey);
    return this.finishLogin(user, res);
  }

  async me(req: Request) {
    try {
      const user = await this.getUserFromAccessToken(req);
      return {
        user: this.serializeUser(user),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return { user: null };
      }
      throw error;
    }
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing.');
    }

    const payload = this.verifyToken(refreshToken, this.getRefreshSecret());
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Session not found.');
    }

    const refreshMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!refreshMatches) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    return this.finishLogin(user, res);
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (refreshToken) {
      try {
        const payload = this.verifyToken(refreshToken, this.getRefreshSecret());
        await this.prisma.user.update({
          where: { id: payload.sub },
          data: { refreshTokenHash: null },
        });
      } catch {
        // ignore invalid token on logout
      }
    }

    this.clearAuthCookies(res);
    return { success: true };
  }

  async forgotPassword(req: Request, dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const rateLimitKey = this.getRateLimitKey('forgot', req, email);
    this.authRateLimitService.check(rateLimitKey, 5, 15 * 60 * 1000);

    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always respond with success to avoid user enumeration.
    if (!user) {
      this.authRateLimitService.recordFailure(rateLimitKey, 15 * 60 * 1000);
      return { success: true };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordTokenExpiresAt: expiresAt,
      },
    });

    this.authRateLimitService.recordFailure(rateLimitKey, 15 * 60 * 1000);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/auth?token=${token}&email=${encodeURIComponent(email)}`;

    await this.sendPasswordResetEmail(email, resetUrl);

    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      return { success: true, devResetUrl: resetUrl };
    }

    return { success: true };
  }

  async resetPassword(req: Request, dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const rateLimitKey = this.getRateLimitKey('reset', req, email);
    this.authRateLimitService.check(rateLimitKey, 8, 15 * 60 * 1000);

    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        resetPasswordTokenHash: tokenHash,
        resetPasswordTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      this.authRateLimitService.recordFailure(rateLimitKey, 15 * 60 * 1000);
      throw new BadRequestException('Reset token is invalid or expired.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        refreshTokenHash: null,
        resetPasswordTokenHash: null,
        resetPasswordTokenExpiresAt: null,
      },
    });

    this.authRateLimitService.clear(rateLimitKey);
    return { success: true };
  }

  getGoogleAuthUrl() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientId || !callbackUrl) {
      throw new BadRequestException('Google auth is not configured.');
    }

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');

    return { url: url.toString() };
  }

  async handleGoogleCallback(code: string, res: Response) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackUrl = this.configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new BadRequestException('Google auth is not configured.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange Google auth code.');
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    if (!tokenData.access_token) {
      throw new UnauthorizedException('Google access token missing.');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedException('Failed to fetch Google profile.');
    }

    const profile = await profileResponse.json() as { id?: string; email?: string; name?: string };
    if (!profile.email || !profile.id) {
      throw new UnauthorizedException('Google profile is incomplete.');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || profile.id,
          name: profile.name || user.name,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          name: profile.name || 'Google User',
          googleId: profile.id,
        },
      });
    }

    await this.finishLogin(user, res);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    res.redirect(frontendUrl);
  }

  private async finishLogin(user: User, res: Response) {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    res.cookie('access_token', accessToken, this.getAccessCookieOptions());
    res.cookie('refresh_token', refreshToken, this.getRefreshCookieOptions());

    return {
      user: this.serializeUser(user),
    };
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      googleConnected: Boolean(user.googleId),
      createdAt: user.createdAt,
    };
  }

  private async getUserFromAccessToken(req: Request) {
    const accessToken = req.cookies?.access_token as string | undefined;
    if (!accessToken) {
      throw new UnauthorizedException('Access token missing.');
    }

    const payload = this.verifyToken(accessToken, this.getAccessSecret());
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return user;
  }

  private verifyToken(token: string, secret: string) {
    return jwt.verify(token, secret) as JwtPayload;
  }

  private signAccessToken(user: User) {
    return jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      this.getAccessSecret(),
      { expiresIn: '15m' },
    );
  }

  private signRefreshToken(user: User) {
    return jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      this.getRefreshSecret(),
      { expiresIn: '30d' },
    );
  }

  private getAccessSecret() {
    return this.jwtAccessSecret;
  }

  private getRefreshSecret() {
    return this.jwtRefreshSecret;
  }

  private getAccessCookieOptions(): CookieOptions {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const sameSite: CookieOptions['sameSite'] = isProd ? 'none' : 'lax';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
      maxAge: 15 * 60 * 1000,
    };
  }

  private getRefreshCookieOptions(): CookieOptions {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const sameSite: CookieOptions['sameSite'] = isProd ? 'none' : 'lax';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };
  }

  private clearAuthCookies(res: Response) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const sameSite = isProd ? 'none' : 'lax';
    const secure = isProd;
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite,
      secure,
      path: '/',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite,
      secure,
      path: '/',
    });
  }

  private getRateLimitKey(action: 'login' | 'register' | 'forgot' | 'reset', req: Request, email: string) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.ip || 'unknown';

    return `${action}:${ip}:${email}`;
  }

  private async sendPasswordResetEmail(email: string, resetUrl: string) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    const fromEmail = this.configService.get<string>('EMAIL_FROM');

    if (!apiKey || !fromEmail) {
      throw new BadRequestException('Email service is not configured.');
    }

    sgMail.setApiKey(apiKey);

    await sgMail.send({
      to: email,
      from: fromEmail,
      subject: 'Reset your LifeOS password',
      text: `Reset your password: ${resetUrl}`,
      html: `
        <p>You requested a password reset.</p>
        <p><a href="${resetUrl}">Click here to reset your password</a></p>
        <p>This link expires in 30 minutes.</p>
      `,
    });
  }
}
