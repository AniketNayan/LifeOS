import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DayMetric = {
  date: string;
  score: number;
  tasksCompleted: number;
  goalContributions: number;
  deepWorkHours: number;
  inRange: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day));
}

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string, selectedYear: number) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const year = Number.isFinite(selectedYear) ? selectedYear : currentYear;

    const [firstTask, firstRecord] = await Promise.all([
      this.prisma.task.findFirst({
        where: { userId },
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
      this.prisma.dailyRecord.findFirst({
        where: { userId },
        orderBy: { date: 'asc' },
        select: { date: true },
      }),
    ]);

    const earliestYear = Math.min(
      firstTask?.date.getUTCFullYear() ?? currentYear,
      firstRecord?.date.getUTCFullYear() ?? currentYear,
      currentYear - 4,
    );

    const availableYears = Array.from(
      { length: currentYear - earliestYear + 1 },
      (_, index) => earliestYear + index,
    );

    const yearStart = utcDate(year, 0, 1);
    const yearEnd = utcDate(year, 11, 31);

    const alignedYearStart = new Date(yearStart);
    alignedYearStart.setUTCDate(yearStart.getUTCDate() - yearStart.getUTCDay());

    const alignedYearEnd = new Date(yearEnd);
    alignedYearEnd.setUTCDate(yearEnd.getUTCDate() + (6 - yearEnd.getUTCDay()));

    const [tasks, dailyRecords] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          userId,
          date: {
            gte: alignedYearStart,
            lte: alignedYearEnd,
          },
        },
        select: {
          date: true,
          completed: true,
          goalId: true,
        },
      }),
      this.prisma.dailyRecord.findMany({
        where: {
          userId,
          date: {
            gte: alignedYearStart,
            lte: alignedYearEnd,
          },
        },
        select: {
          date: true,
          productivityScore: true,
          goalContributions: true,
          deepWorkHours: true,
        },
      }),
    ]);

    const tasksByDate = tasks.reduce<Record<string, { tasksCompleted: number }>>((acc, task) => {
      const key = toDateKey(task.date);
      const current = acc[key] || { tasksCompleted: 0 };
      acc[key] = {
        tasksCompleted: current.tasksCompleted + (task.completed ? 1 : 0),
      };
      return acc;
    }, {});

    const recordsByDate = dailyRecords.reduce<Record<string, { score: number; goalContributions: number; deepWorkHours: number }>>((acc, record) => {
      acc[toDateKey(record.date)] = {
        score: record.productivityScore,
        goalContributions: record.goalContributions,
        deepWorkHours: record.deepWorkHours,
      };
      return acc;
    }, {});

    const yearRangeStart = toDateKey(yearStart);
    const yearRangeEnd = toDateKey(yearEnd);
    const activityDays: DayMetric[] = [];

    for (const cursor = new Date(alignedYearStart); cursor <= alignedYearEnd; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const date = toDateKey(cursor);
      const record = recordsByDate[date];
      const taskStats = tasksByDate[date];
      activityDays.push({
        date,
        score: record?.score ?? 0,
        tasksCompleted: taskStats?.tasksCompleted ?? 0,
        goalContributions: record?.goalContributions ?? 0,
        deepWorkHours: record?.deepWorkHours ?? 0,
        inRange: date >= yearRangeStart && date <= yearRangeEnd,
      });
    }

    const yearlyDays = activityDays.filter((day) => day.inRange);
    const activeYearDays = yearlyDays.filter((day) => day.score > 0 || day.tasksCompleted > 0 || day.goalContributions > 0 || day.deepWorkHours > 0);
    const daysInYear = isLeapYear(year) ? 366 : 365;

    const averageScore = activeYearDays.length > 0
      ? activeYearDays.reduce((sum, day) => sum + day.score, 0) / activeYearDays.length
      : 0;

    const totalTasks = yearlyDays.reduce((sum, day) => sum + day.tasksCompleted, 0);
    const totalGoals = yearlyDays.reduce((sum, day) => sum + day.goalContributions, 0);
    const totalFocusHours = yearlyDays.reduce((sum, day) => sum + day.deepWorkHours, 0);
    const bestDay = yearlyDays.reduce<DayMetric | null>((best, day) => {
      if (!best || day.score > best.score) {
        return day;
      }
      return best;
    }, null) ?? {
      date: yearRangeStart,
      score: 0,
      tasksCompleted: 0,
      goalContributions: 0,
      deepWorkHours: 0,
      inRange: true,
    };

    const currentStreak = [...yearlyDays].reverse().reduce((streak, day) => {
      if (streak.broken) {
        return streak;
      }
      if (day.score > 0 || day.tasksCompleted > 0 || day.goalContributions > 0 || day.deepWorkHours > 0) {
        return { ...streak, value: streak.value + 1 };
      }
      return { ...streak, broken: true };
    }, { value: 0, broken: false }).value;

    const bestWeek = Array.from({ length: Math.max(yearlyDays.length - 6, 0) }, (_, index) => {
      const slice = yearlyDays.slice(index, index + 7);
      const score = slice.reduce((sum, day) => sum + day.score, 0);
      return { score, start: slice[0]?.date ?? '', end: slice[slice.length - 1]?.date ?? '' };
    }).reduce((best, week) => week.score > best.score ? week : best, { score: 0, start: '', end: '' });

    const highlightDays = [...yearlyDays]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter((day) => day.score > 0);

    const alignedYearStartTime = utcDate(
      alignedYearStart.getUTCFullYear(),
      alignedYearStart.getUTCMonth(),
      alignedYearStart.getUTCDate(),
    ).getTime();

    const getWeekColumn = (date: Date) => {
      const normalized = utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).getTime();
      return Math.floor((normalized - alignedYearStartTime) / MS_PER_DAY / 7) + 1;
    };

    const monthLabels = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = utcDate(year, monthIndex, 1);
      return {
        label: monthStart.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        startColumn: getWeekColumn(monthStart),
      };
    });

    const activityWeeks = Array.from({ length: Math.ceil(activityDays.length / 7) }, (_, weekIndex) =>
      activityDays.slice(weekIndex * 7, weekIndex * 7 + 7),
    );

    return {
      selectedYear: year,
      currentYear,
      availableYears,
      daysInYear,
      yearlyActiveDays: activeYearDays.length,
      averageScore,
      totalTasks,
      totalGoals,
      totalFocusHours,
      bestDay,
      currentStreak,
      bestWeek,
      highlightDays,
      monthLabels,
      activityWeeks,
    };
  }
}
