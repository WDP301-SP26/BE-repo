import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: 'Nguyễn Văn B (Updated)', required: false })
  full_name?: string;

  @ApiProperty({ example: 'SE888888', required: false })
  student_id?: string;

  @ApiProperty({ example: 'newSecurePassword123', required: false })
  password?: string;
}
