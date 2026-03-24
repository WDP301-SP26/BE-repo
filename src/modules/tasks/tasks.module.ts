import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Group,
  GroupMembership,
  IntegrationToken,
  Task,
  User,
} from '../../entities';
import { JiraModule } from '../jira/jira.module';
import { TaskWriteRateLimitGuard } from './guards/task-write-rate-limit.guard';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Group,
      GroupMembership,
      User,
      IntegrationToken,
    ]),
    JiraModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskWriteRateLimitGuard],
  exports: [TasksService],
})
export class TasksModule {}
