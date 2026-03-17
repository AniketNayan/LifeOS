import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { CreateShortGoalDto } from './dto/create-short-goal.dto';
import { UpdateShortGoalDto } from './dto/update-short-goal.dto';
import { ListGoalsQueryDto } from './dto/list-goals-query.dto';

const goalInclude = {
  milestones: {
    include: {
      shortGoals: true,
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListGoalsQueryDto) {
    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    if (!query.page || !query.pageSize) {
      return this.prisma.goal.findMany({
        where,
        include: goalInclude,
        orderBy: { createdAt: 'asc' },
      });
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.goal.findMany({
        where,
        include: goalInclude,
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.goal.count({ where }),
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

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        userId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        reward: dto.reward?.trim() || null,
        status: dto.status || 'active',
      },
      include: goalInclude,
    });
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto) {
    await this.ensureGoalOwnership(userId, goalId);

    return this.prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate ? new Date(dto.startDate) : null } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
        ...(dto.targetDate !== undefined ? { targetDate: dto.targetDate ? new Date(dto.targetDate) : null } : {}),
        ...(dto.reward !== undefined ? { reward: dto.reward?.trim() || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.rewardClaimed !== undefined ? { rewardClaimed: dto.rewardClaimed } : {}),
        ...(dto.contributionDays !== undefined ? { contributionDays: dto.contributionDays } : {}),
      },
      include: goalInclude,
    });
  }

  async remove(userId: string, goalId: string) {
    await this.ensureGoalOwnership(userId, goalId);
    await this.prisma.goal.delete({ where: { id: goalId } });
    return { success: true };
  }

  async addMilestone(userId: string, goalId: string, dto: CreateMilestoneDto) {
    await this.ensureGoalOwnership(userId, goalId);

    return this.prisma.milestone.create({
      data: {
        goalId,
        title: dto.title.trim(),
      },
      include: {
        shortGoals: true,
      },
    });
  }

  async updateMilestone(userId: string, goalId: string, milestoneId: string, dto: UpdateMilestoneDto) {
    await this.ensureMilestoneOwnership(userId, goalId, milestoneId);

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      },
      include: {
        shortGoals: true,
      },
    });
  }

  async removeMilestone(userId: string, goalId: string, milestoneId: string) {
    await this.ensureMilestoneOwnership(userId, goalId, milestoneId);
    await this.prisma.milestone.delete({ where: { id: milestoneId } });
    return { success: true };
  }

  async addShortGoal(userId: string, goalId: string, milestoneId: string, dto: CreateShortGoalDto) {
    await this.ensureMilestoneOwnership(userId, goalId, milestoneId);

    return this.prisma.shortGoal.create({
      data: {
        milestoneId,
        title: dto.title.trim(),
        completed: dto.completed ?? false,
        estimatedTime: dto.estimatedTime,
        priority: dto.priority || 'medium',
      },
    });
  }

  async updateShortGoal(userId: string, goalId: string, milestoneId: string, shortGoalId: string, dto: UpdateShortGoalDto) {
    await this.ensureShortGoalOwnership(userId, goalId, milestoneId, shortGoalId);

    return this.prisma.shortGoal.update({
      where: { id: shortGoalId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.completed !== undefined ? { completed: dto.completed } : {}),
        ...(dto.estimatedTime !== undefined ? { estimatedTime: dto.estimatedTime } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      },
    });
  }

  async removeShortGoal(userId: string, goalId: string, milestoneId: string, shortGoalId: string) {
    await this.ensureShortGoalOwnership(userId, goalId, milestoneId, shortGoalId);
    await this.prisma.shortGoal.delete({ where: { id: shortGoalId } });
    return { success: true };
  }

  async claimReward(userId: string, goalId: string) {
    await this.ensureGoalOwnership(userId, goalId);

    // Check if all short goals are completed
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        milestones: {
          include: {
            shortGoals: true,
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found.');
    }

    const allShortGoalsCompleted = goal.milestones.every(milestone =>
      milestone.shortGoals.every(shortGoal => shortGoal.completed)
    );

    if (!allShortGoalsCompleted) {
      throw new BadRequestException('Cannot claim reward: not all short goals are completed.');
    }

    return this.prisma.goal.update({
      where: { id: goalId },
      data: {
        rewardClaimed: true,
        status: 'completed',
      },
      include: goalInclude,
    });
  }

  private async ensureGoalOwnership(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found.');
    }
  }

  private async ensureMilestoneOwnership(userId: string, goalId: string, milestoneId: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        goalId,
        goal: {
          userId,
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found.');
    }
  }

  private async ensureShortGoalOwnership(userId: string, goalId: string, milestoneId: string, shortGoalId: string) {
    const shortGoal = await this.prisma.shortGoal.findFirst({
      where: {
        id: shortGoalId,
        milestoneId,
        milestone: {
          id: milestoneId,
          goalId,
          goal: {
            userId,
          },
        },
      },
    });

    if (!shortGoal) {
      throw new NotFoundException('Short goal not found.');
    }
  }
}
