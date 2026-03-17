import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

type AuthPayload = {
  sub: string;
  email: string;
  name: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthPayload;
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtAccessSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtAccessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'default-secret';
    if (!this.jwtAccessSecret) {
      throw new Error('JWT_ACCESS_SECRET environment variable is required');
    }
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.access_token as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Access token missing.');
    }

    try {
      const payload = jwt.verify(
        token,
        this.jwtAccessSecret,
      ) as AuthPayload;

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }
  }
}
