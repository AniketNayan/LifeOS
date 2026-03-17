import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let prisma: any;
  let service: AnalyticsService;

  beforeEach(() => {
    prisma = {
      task: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      dailyRecord: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new AnalyticsService(prisma);
  });

  it('builds a yearly overview with heatmap and summary metrics', async () => {
    prisma.task.findFirst.mockResolvedValue({ date: new Date('2024-01-10T00:00:00.000Z') });
    prisma.dailyRecord.findFirst.mockResolvedValue({ date: new Date('2024-01-09T00:00:00.000Z') });

    prisma.task.findMany.mockResolvedValue([
      { date: new Date('2026-01-11T00:00:00.000Z'), completed: true, goalId: 'goal-1' },
      { date: new Date('2026-01-11T00:00:00.000Z'), completed: true, goalId: null },
      { date: new Date('2026-01-12T00:00:00.000Z'), completed: false, goalId: null },
    ]);

    prisma.dailyRecord.findMany.mockResolvedValue([
      {
        date: new Date('2026-01-11T00:00:00.000Z'),
        productivityScore: 8,
        goalContributions: 2,
        deepWorkHours: 1.5,
      },
      {
        date: new Date('2026-01-12T00:00:00.000Z'),
        productivityScore: 5,
        goalContributions: 0,
        deepWorkHours: 0,
      },
    ]);

    const result = await service.getOverview('user-1', 2026);

    expect(result.selectedYear).toBe(2026);
    expect(result.availableYears).toContain(2026);
    expect(result.monthLabels).toHaveLength(12);
    expect(result.totalTasks).toBe(2);
    expect(result.totalGoals).toBe(2);
    expect(result.totalFocusHours).toBe(1.5);
    expect(result.bestDay.score).toBe(8);
    expect(result.activityWeeks.length).toBeGreaterThan(0);
  });
});
