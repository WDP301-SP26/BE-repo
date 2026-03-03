import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: 'SWP391' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Software Architecture' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'SP26' })
  @IsString()
  @IsOptional()
  semester?: string;

  @ApiProperty({
    example: ['student1@edu.vn', 'student2@edu.vn'],
    description: 'List of student emails to send enrollment key',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  studentEmails: string[];
}
