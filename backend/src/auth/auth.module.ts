import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRateLimitService } from './auth-rate-limit.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRateLimitService],
})
export class AuthModule {}
