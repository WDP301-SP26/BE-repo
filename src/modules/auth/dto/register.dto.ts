import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'newuser@example.com',
    description: 'Địa chỉ email đăng ký',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Mật khẩu (tối thiểu 6 ký tự)',
  })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải tối thiểu 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên đầy đủ' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đầy đủ là bắt buộc' })
  full_name: string;

  @ApiProperty({
    example: 'SE123456',
    description: 'Mã số sinh viên (tùy chọn)',
    required: false,
  })
  @IsString()
  @IsOptional()
  student_id?: string; // Optional for OAuth users
}
