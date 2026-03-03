import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { In, Repository } from 'typeorm';
import { ClassMembership } from '../../entities/class-membership.entity';
import { Class } from '../../entities/class.entity';
import { Group } from '../../entities/group.entity';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(ClassMembership)
    private readonly classMembershipRepo: Repository<ClassMembership>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createClass(lecturerId: string, dto: CreateClassDto) {
    // 1. Generate Enrollment Key
    const enrollmentKey = randomBytes(4).toString('hex').toUpperCase();

    // 2. Create the Class
    const newClass = this.classRepo.create({
      code: dto.code,
      name: dto.name,
      semester: dto.semester,
      lecturer_id: lecturerId,
      enrollment_key: enrollmentKey,
    });
    const savedClass = await this.classRepo.save(newClass);

    // 3. Auto-generate 7 Empty Groups
    const groupsToCreate: Partial<Group>[] = [];
    for (let i = 1; i <= 7; i++) {
      groupsToCreate.push({
        name: `Group ${i}`,
        class_id: savedClass.id,
        created_by_id: lecturerId, // using lecturer as the original creator
      });
    }
    await this.groupRepo.insert(groupsToCreate);

    // 4. Send Notifications to students
    if (dto.studentEmails && dto.studentEmails.length > 0) {
      const students = await this.userRepo.find({
        where: { email: In(dto.studentEmails) },
      });

      if (students.length > 0) {
        const notifications = students.map((student) => ({
          user_id: student.id,
          title: `You are invited to join ${dto.code}`,
          message: `Lecturer has invited you to join ${dto.code}. Your enrollment key is: ${enrollmentKey}`,
        }));
        await this.notifRepo.insert(notifications);
      }
    }

    return savedClass;
  }

  async getAllClasses(userId: string, role: string) {
    if (role === 'LECTURER') {
      return this.classRepo.find({ where: { lecturer_id: userId } });
    } else {
      // Return classes the student is enrolled in + available classes? Let's just return all for simplicity or only valid ones.
      return this.classRepo.find();
    }
  }

  async myClasses(studentId: string) {
    const memberships = await this.classMembershipRepo.find({
      where: { user_id: studentId },
      relations: ['class'],
    });
    return memberships.map((m) => m.class);
  }

  async joinClass(studentId: string, classId: string, dto: JoinClassDto) {
    const targetClass = await this.classRepo.findOne({
      where: { id: classId },
    });
    if (!targetClass) {
      throw new NotFoundException('Class not found');
    }

    if (targetClass.enrollment_key !== dto.enrollment_key) {
      throw new BadRequestException('Invalid enrollment key');
    }

    const existing = await this.classMembershipRepo.findOne({
      where: { class_id: classId, user_id: studentId },
    });

    if (existing) {
      throw new BadRequestException('You are already in this class');
    }

    const membership = this.classMembershipRepo.create({
      class_id: classId,
      user_id: studentId,
    });

    await this.classMembershipRepo.save(membership);
    return { message: 'Joined class successfully' };
  }
}
