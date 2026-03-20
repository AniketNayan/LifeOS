import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Req() req: Request, @Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(req, dto, res);
  }

  @Post('login')
  login(@Req() req: Request, @Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req, dto, res);
  }

  @Post('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }

  @Post('forgot-password')
  forgotPassword(@Req() req: Request, @Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(req, dto);
  }

  @Post('reset-password')
  resetPassword(@Req() req: Request, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(req, dto);
  }

  @Get('me')
  me(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.me(req, res);
  }

  @Get('google/url')
  googleAuthUrl() {
    return this.authService.getGoogleAuthUrl();
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    return this.authService.handleGoogleCallback(code, res);
  }
}
