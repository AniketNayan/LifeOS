import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { DailyRecordsService } from './daily-records.service';
import { UpsertDailyRecordDto } from './dto/upsert-daily-record.dto';

@UseGuards(AuthGuard)
@Controller('daily-records')
export class DailyRecordsController {
  constructor(private readonly dailyRecordsService: DailyRecordsService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.dailyRecordsService.findAll(req.user.sub);
  }

  @Put(':date')
  upsert(
    @Req() req: AuthenticatedRequest,
    @Param('date') date: string,
    @Body() dto: UpsertDailyRecordDto,
  ) {
    return this.dailyRecordsService.upsert(req.user.sub, date, dto);
  }
}
