import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TopicService } from './topic.service';

@ApiTags('Topics')
@Controller('topics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available project topics' })
  async getAllTopics() {
    return this.topicService.getAllTopics();
  }
}
