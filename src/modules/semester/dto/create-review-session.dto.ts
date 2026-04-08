import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  ReviewMilestoneCode,
  ReviewSessionStatus,
} from '../../../common/enums';

export class ReviewSessionParticipantReportDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID('4')
  user_id: string;

  @ApiPropertyOptional({ example: 'Student 1' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  user_name?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  present: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  did_contribute: boolean;

  @ApiPropertyOptional({
    example: 'Implemented login flow and group dashboard.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  contribution_summary?: string;

  @ApiPropertyOptional({ example: ['Created task list', 'Fixed API contract'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completed_items?: string[];

  @ApiPropertyOptional({ example: ['Still need to finish validation'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pending_items?: string[];

  @ApiPropertyOptional({ example: 'Needs follow-up on task ownership.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class CreateReviewSessionDto {
  @ApiProperty({ enum: ReviewMilestoneCode })
  @IsEnum(ReviewMilestoneCode)
  milestone_code: ReviewMilestoneCode;

  @ApiProperty({ example: '2026-03-12T09:00:00.000Z' })
  @IsDateString()
  review_date: string;

  @ApiProperty({ example: 'Review 1 progress review' })
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiPropertyOptional({ enum: ReviewSessionStatus })
  @IsOptional()
  @IsEnum(ReviewSessionStatus)
  status?: ReviewSessionStatus;

  @ApiPropertyOptional({
    example: 'Weekly review with task ownership and blocker check.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  lecturer_note?: string;

  @ApiProperty({ type: [ReviewSessionParticipantReportDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReviewSessionParticipantReportDto)
  participant_reports: ReviewSessionParticipantReportDto[];
}
