import { Module } from '@nestjs/common';
import { DailyRecordsController } from './daily-records.controller';
import { DailyRecordsService } from './daily-records.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DailyRecordsController],
  providers: [DailyRecordsService],
})
export class DailyRecordsModule {}
