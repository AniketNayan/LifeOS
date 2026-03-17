import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { CreateShortGoalDto } from './dto/create-short-goal.dto';
import { UpdateShortGoalDto } from './dto/update-short-goal.dto';
import { ListGoalsQueryDto } from './dto/list-goals-query.dto';

@UseGuards(AuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() query: ListGoalsQueryDto) {
    return this.goalsService.findAll(req.user.sub, query);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.sub, dto);
  }

  @Patch(':goalId')
  update(@Req() req: AuthenticatedRequest, @Param('goalId') goalId: string, @Body() dto: UpdateGoalDto) {
    return this.goalsService.update(req.user.sub, goalId, dto);
  }

  @Delete(':goalId')
  remove(@Req() req: AuthenticatedRequest, @Param('goalId') goalId: string) {
    return this.goalsService.remove(req.user.sub, goalId);
  }

  @Post(':goalId/milestones')
  addMilestone(@Req() req: AuthenticatedRequest, @Param('goalId') goalId: string, @Body() dto: CreateMilestoneDto) {
    return this.goalsService.addMilestone(req.user.sub, goalId, dto);
  }

  @Patch(':goalId/milestones/:milestoneId')
  updateMilestone(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.goalsService.updateMilestone(req.user.sub, goalId, milestoneId, dto);
  }

  @Delete(':goalId/milestones/:milestoneId')
  removeMilestone(@Req() req: AuthenticatedRequest, @Param('goalId') goalId: string, @Param('milestoneId') milestoneId: string) {
    return this.goalsService.removeMilestone(req.user.sub, goalId, milestoneId);
  }

  @Post(':goalId/milestones/:milestoneId/short-goals')
  addShortGoal(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: CreateShortGoalDto,
  ) {
    return this.goalsService.addShortGoal(req.user.sub, goalId, milestoneId, dto);
  }

  @Patch(':goalId/milestones/:milestoneId/short-goals/:shortGoalId')
  updateShortGoal(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
    @Param('shortGoalId') shortGoalId: string,
    @Body() dto: UpdateShortGoalDto,
  ) {
    return this.goalsService.updateShortGoal(req.user.sub, goalId, milestoneId, shortGoalId, dto);
  }

  @Delete(':goalId/milestones/:milestoneId/short-goals/:shortGoalId')
  removeShortGoal(
    @Req() req: AuthenticatedRequest,
    @Param('goalId') goalId: string,
    @Param('milestoneId') milestoneId: string,
    @Param('shortGoalId') shortGoalId: string,
  ) {
    return this.goalsService.removeShortGoal(req.user.sub, goalId, milestoneId, shortGoalId);
  }

  @Post(':goalId/claim-reward')
  claimReward(@Req() req: AuthenticatedRequest, @Param('goalId') goalId: string) {
    return this.goalsService.claimReward(req.user.sub, goalId);
  }
}
