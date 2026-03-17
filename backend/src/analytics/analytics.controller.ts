import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(
    @Req() req: AuthenticatedRequest,
    @Query('year') year?: string,
  ) {
    return this.analyticsService.getOverview(
      req.user.sub,
      year ? Number.parseInt(year, 10) : new Date().getUTCFullYear(),
    );
  }
}
