import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group, GroupMembership, Task, User } from '../../entities';
import { TasksController } from './tasks.controller';
import { TaskWriteRateLimitGuard } from './guards/task-write-rate-limit.guard';
import { TasksService } from './tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Group, GroupMembership, User])],
  controllers: [TasksController],
  providers: [TasksService, TaskWriteRateLimitGuard],
  exports: [TasksService],
})
export class TasksModule {}
