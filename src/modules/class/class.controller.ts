import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthorizedRequest } from '../auth/auth.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';

@ApiTags('Classes')
@Controller('classes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new class (Lecturer only)' })
  @ApiResponse({
    status: 201,
    description:
      'Class created alongside 7 empty groups and notifications sent',
  })
  async createClass(
    @Req() req: AuthorizedRequest,
    @Body() dto: CreateClassDto,
  ) {
    return this.classService.createClass(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classes' })
  async getClasses(@Req() req: AuthorizedRequest) {
    return this.classService.getAllClasses(req.user.id, req.user.role);
  }

  @Get('my-classes')
  @ApiOperation({ summary: 'Get classes enrolled by the current user' })
  async getMyClasses(@Req() req: AuthorizedRequest) {
    return this.classService.myClasses(req.user.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a class using an enrollment key' })
  async joinClass(
    @Req() req: AuthorizedRequest,
    @Param('id') classId: string,
    @Body() dto: JoinClassDto,
  ) {
    return this.classService.joinClass(req.user.id, classId, dto);
  }
}
