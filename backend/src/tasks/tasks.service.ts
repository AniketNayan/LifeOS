import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListTasksQueryDto) {
    const where = {
      userId,
      ...(query.completed !== undefined ? { completed: query.completed } : {}),
      ...(query.goalId ? { goalId: query.goalId } : {}),
      ...(query.milestoneId ? { milestoneId: query.milestoneId } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(
        query.date || query.from || query.to
          ? {
              date: {
                ...(query.date ? { gte: new Date(`${query.date}T00:00:00.000Z`), lte: new Date(`${query.date}T23:59:59.999Z`) } : {}),
                ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
                ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
              },
            }
          : {}
      ),
    };

    const orderBy = [
      { date: 'asc' as const },
      { createdAt: 'asc' as const },
    ];

    if (!query.page || !query.pageSize) {
      return this.prisma.task.findMany({
        where,
        orderBy,
      });
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        userId,
        title: dto.title.trim(),
        completed: dto.completed ?? false,
        estimatedTime: dto.estimatedTime,
        priority: dto.priority,
        date: new Date(dto.date),
        goalId: dto.goalId || null,
        milestoneId: dto.milestoneId || null,
      },
    });
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    await this.ensureTaskOwnership(userId, taskId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.completed !== undefined ? { completed: dto.completed } : {}),
        ...(dto.estimatedTime !== undefined ? { estimatedTime: dto.estimatedTime } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.goalId !== undefined ? { goalId: dto.goalId || null } : {}),
        ...(dto.milestoneId !== undefined ? { milestoneId: dto.milestoneId || null } : {}),
      },
    });
  }

  async remove(userId: string, taskId: string) {
    await this.ensureTaskOwnership(userId, taskId);
    await this.prisma.task.delete({ where: { id: taskId } });
    return { success: true };
  }

  async toggle(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    const nextCompleted = !task.completed;

    return this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          completed: nextCompleted,
        },
      });

      if (task.goalId) {
        const goal = await tx.goal.findUnique({ where: { id: task.goalId } });
        if (goal) {
          await tx.goal.update({
            where: { id: task.goalId },
            data: {
              contributionDays: nextCompleted
                ? goal.contributionDays + 1
                : Math.max(goal.contributionDays - 1, 0),
            },
          });
        }
      }

      return updatedTask;
    });
  }

  private async ensureTaskOwnership(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }
  }
}
