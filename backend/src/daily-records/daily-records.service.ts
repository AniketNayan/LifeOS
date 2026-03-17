import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertDailyRecordDto } from './dto/upsert-daily-record.dto';

@Injectable()
export class DailyRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.dailyRecord.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
  }

  async upsert(userId: string, date: string, dto: UpsertDailyRecordDto) {
    const recordDate = new Date(`${date}T00:00:00.000Z`);

    return this.prisma.dailyRecord.upsert({
      where: {
        userId_date: {
          userId,
          date: recordDate,
        },
      },
      update: {
        ...(dto.topTasks !== undefined ? { topTasks: dto.topTasks as object } : {}),
        ...(dto.mainFocus !== undefined ? { mainFocus: dto.mainFocus } : {}),
        ...(dto.productivityScore !== undefined ? { productivityScore: dto.productivityScore } : {}),
        ...(dto.deepWorkHours !== undefined ? { deepWorkHours: dto.deepWorkHours } : {}),
        ...(dto.healthDone !== undefined ? { healthDone: dto.healthDone } : {}),
        ...(dto.distractionFree !== undefined ? { distractionFree: dto.distractionFree } : {}),
        ...(dto.workNotes !== undefined ? { workNotes: dto.workNotes } : {}),
        ...(dto.personalThoughts !== undefined ? { personalThoughts: dto.personalThoughts } : {}),
        ...(dto.lessonsLearned !== undefined ? { lessonsLearned: dto.lessonsLearned } : {}),
        ...(dto.goalContributions !== undefined ? { goalContributions: dto.goalContributions } : {}),
      },
      create: {
        userId,
        date: recordDate,
        topTasks: (dto.topTasks as object | undefined) ?? undefined,
        mainFocus: dto.mainFocus ?? '',
        productivityScore: dto.productivityScore ?? 5,
        deepWorkHours: dto.deepWorkHours ?? 0,
        healthDone: dto.healthDone ?? false,
        distractionFree: dto.distractionFree ?? false,
        workNotes: dto.workNotes ?? '',
        personalThoughts: dto.personalThoughts ?? '',
        lessonsLearned: dto.lessonsLearned ?? '',
        goalContributions: dto.goalContributions ?? 0,
      },
    });
  }
}
