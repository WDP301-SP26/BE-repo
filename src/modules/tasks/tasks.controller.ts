import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../common/enums';
import type { AuthorizedRequest } from '../auth/auth.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskWriteRateLimitGuard } from './guards/task-write-rate-limit.guard';
import { PaginatedTasksEntity, TaskResponseEntity } from './entities/task-response.entity';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({
    summary: 'List internal tasks for groups the caller has joined',
  })
  @ApiResponse({ status: 200, type: PaginatedTasksEntity })
  async findAll(@Req() req: AuthorizedRequest, @Query() query: QueryTasksDto) {
    return this.tasksService.findAll(req.user.id, query);
  }

  @Post()
  @UseGuards(TaskWriteRateLimitGuard)
  @ApiOperation({ summary: 'Create internal task for a group' })
  @ApiResponse({ status: 201, type: TaskResponseEntity })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Task or group not found' })
  async create(@Req() req: AuthorizedRequest, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, req.user.role as Role, dto);
  }

  @Patch(':id')
  @UseGuards(TaskWriteRateLimitGuard)
  @ApiOperation({ summary: 'Update internal task' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, type: TaskResponseEntity })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Task or group not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthorizedRequest,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, req.user.id, req.user.role as Role, dto);
  }

  @Delete(':id')
  @UseGuards(TaskWriteRateLimitGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete internal task' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 204, description: 'Task deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Task or group not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthorizedRequest,
  ) {
    await this.tasksService.remove(id, req.user.id, req.user.role as Role);
  }
}
