import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';

@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query() query: ListTasksQueryDto) {
    return this.tasksService.findAll(req.user.sub, query);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.sub, dto);
  }

  @Patch(':taskId')
  update(@Req() req: AuthenticatedRequest, @Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(req.user.sub, taskId, dto);
  }

  @Delete(':taskId')
  remove(@Req() req: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.tasksService.remove(req.user.sub, taskId);
  }

  @Post(':taskId/toggle')
  toggle(@Req() req: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.tasksService.toggle(req.user.sub, taskId);
  }
}
