import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinClassDto {
  @ApiProperty({ example: 'RANDOM-KEY-123' })
  @IsString()
  @IsNotEmpty()
  enrollment_key: string;
}
