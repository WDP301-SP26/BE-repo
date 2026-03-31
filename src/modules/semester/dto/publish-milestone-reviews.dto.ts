import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReviewMilestoneCode } from '../../../common/enums';

export class PublishMilestoneReviewsDto {
  @ApiProperty({
    enum: ReviewMilestoneCode,
    description: 'Milestone code to publish scores for',
  })
  @IsEnum(ReviewMilestoneCode)
  milestone_code: ReviewMilestoneCode;

  @ApiProperty({
    required: false,
    description: 'Optional class UUID to scope publishing to a single class',
  })
  @IsOptional()
  @IsUUID()
  class_id?: string;
}
