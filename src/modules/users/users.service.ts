import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Bước 1: Kiểm tra xem email đã tồn tại chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng!');
    }

    // Bước 2: Mã hóa mật khẩu (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // Bước 3: Lưu vào Database
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password_hash: hashedPassword, // Changed to password_hash
        full_name: createUserDto.full_name,
        student_id: createUserDto.student_id,
        primary_provider: 'EMAIL', // Default to EMAIL for email/password registration
      },
    });

    // Bước 4: Trả về kết quả (Loại bỏ password_hash để bảo mật)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = newUser;
    return result;
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Nếu có update password thì phải hash lại
    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = updateUserDto;
      return this.prisma.user.update({
        where: { id },
        data: { ...rest, password_hash: hashedPassword },
      });
    }
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
