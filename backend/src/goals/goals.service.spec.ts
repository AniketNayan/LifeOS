import { NotFoundException } from '@nestjs/common';
import { GoalsService } from './goals.service';

describe('GoalsService', () => {
  let prisma: any;
  let service: GoalsService;

  beforeEach(() => {
    prisma = {
      goal: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
      },
      milestone: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      shortGoal: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new GoalsService(prisma);
  });

  it('returns paginated goals when page and pageSize are provided', async () => {
    const items = [{ id: 'goal-1', title: 'Goal', milestones: [] }];
    prisma.$transaction.mockResolvedValue([items, 7]);

    const result = await service.findAll('user-1', {
      status: 'active',
      page: 2,
      pageSize: 3,
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      items,
      pagination: {
        page: 2,
        pageSize: 3,
        total: 7,
        totalPages: 3,
      },
    });
  });

  it('claims a reward by marking the goal completed', async () => {
    prisma.goal.findFirst.mockResolvedValue({ id: 'goal-1', userId: 'user-1' });
    prisma.goal.update.mockResolvedValue({ id: 'goal-1', rewardClaimed: true, status: 'completed' });

    const result = await service.claimReward('user-1', 'goal-1');

    expect(prisma.goal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'goal-1' },
        data: {
          rewardClaimed: true,
          status: 'completed',
        },
      }),
    );
    expect(result.rewardClaimed).toBe(true);
  });

  it('adds a short goal with trimmed title and default values', async () => {
    prisma.milestone.findFirst.mockResolvedValue({ id: 'milestone-1' });
    prisma.shortGoal.create.mockResolvedValue({ id: 'short-1', title: 'Run 5K', completed: false, priority: 'medium' });

    await service.addShortGoal('user-1', 'goal-1', 'milestone-1', {
      title: '  Run 5K  ',
    });

    expect(prisma.shortGoal.create).toHaveBeenCalledWith({
      data: {
        milestoneId: 'milestone-1',
        title: 'Run 5K',
        completed: false,
        estimatedTime: undefined,
        priority: 'medium',
      },
    });
  });

  it('throws when goal ownership check fails', async () => {
    prisma.goal.findFirst.mockResolvedValue(null);

    await expect(service.claimReward('user-1', 'missing-goal')).rejects.toBeInstanceOf(NotFoundException);
  });
});
