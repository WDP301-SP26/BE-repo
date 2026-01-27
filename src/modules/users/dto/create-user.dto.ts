import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'admin_created@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SE112233', description: 'Mã số sinh viên' })
  @IsNotEmpty()
  student_id: string;

  @ApiProperty({ example: 'adminPassword123' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải tối thiểu 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Trần Thị B' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đầy đủ là bắt buộc' })
  full_name: string;
}
