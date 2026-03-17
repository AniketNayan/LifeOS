import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let prisma: any;
  let service: TasksService;

  beforeEach(() => {
    prisma = {
      task: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
      },
      goal: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new TasksService(prisma);
  });

  it('returns paginated tasks when page and pageSize are provided', async () => {
    const items = [{ id: 'task-1', title: 'Task' }];
    prisma.$transaction.mockResolvedValue([items, 9]);

    const result = await service.findAll('user-1', {
      completed: false,
      page: 1,
      pageSize: 4,
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual({
      items,
      pagination: {
        page: 1,
        pageSize: 4,
        total: 9,
        totalPages: 3,
      },
    });
  });

  it('toggles a task and increments goal contribution days when completing', async () => {
    prisma.task.findFirst.mockResolvedValue({
      id: 'task-1',
      userId: 'user-1',
      completed: false,
      goalId: 'goal-1',
    });

    prisma.$transaction.mockImplementation(async (callback: any) => callback({
      task: {
        update: jest.fn().mockResolvedValue({ id: 'task-1', completed: true }),
      },
      goal: {
        findUnique: jest.fn().mockResolvedValue({ id: 'goal-1', contributionDays: 2 }),
        update: jest.fn().mockResolvedValue({ id: 'goal-1', contributionDays: 3 }),
      },
    }));

    const result = await service.toggle('user-1', 'task-1');

    expect(result).toEqual({ id: 'task-1', completed: true });
  });

  it('throws when toggling a task that does not belong to the user', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(service.toggle('user-1', 'missing-task')).rejects.toBeInstanceOf(NotFoundException);
  });
});
