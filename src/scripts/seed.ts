import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { AuthProvider, Role } from '../common/enums';
import { Topic } from '../entities/topic.entity';
import { User } from '../entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Synchronizing database schema...');
  await dataSource.synchronize(false); // don't drop tables, just sync

  const userRepository = dataSource.getRepository(User);
  const topicRepository = dataSource.getRepository(Topic);

  console.log('Seeding Mr.Teo (Lecturer)...');
  let lecturer = await userRepository.findOne({
    where: { email: 'mr.teo@edu.vn' },
  });
  if (!lecturer) {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash('password123', salt);
    lecturer = userRepository.create({
      email: 'mr.teo@edu.vn',
      full_name: 'Mr. Teo',
      password_hash: passwordHash,
      role: Role.LECTURER,
      primary_provider: AuthProvider.EMAIL,
      is_email_verified: true,
    });
    await userRepository.save(lecturer);
    console.log('Created Mr.Teo (Lecturer)');
  } else {
    console.log('Mr.Teo already exists');
  }

  console.log('Seeding 35 Students...');
  for (let i = 1; i <= 35; i++) {
    const email = `student${i}@edu.vn`;
    const existing = await userRepository.findOne({ where: { email } });
    if (!existing) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash('password123', salt);
      const student = userRepository.create({
        email,
        full_name: `Student ${i}`,
        student_id: `HE1500${i.toString().padStart(2, '0')}`,
        password_hash: passwordHash,
        role: Role.STUDENT,
        primary_provider: AuthProvider.EMAIL,
        is_email_verified: true,
      });
      await userRepository.save(student);
    }
  }
  console.log('Created 35 Students');

  console.log('Seeding 7 Default Topics...');
  const defaultTopics = [
    {
      name: 'E-commerce System',
      description: 'Build an e-commerce platform with NextJS and NestJS',
    },
    {
      name: 'Hotel Management',
      description: 'Manage hotel bookings, rooms, and staff',
    },
    {
      name: 'Online Learning Platform',
      description: 'Platform for courses, quizzes, and certificates',
    },
    {
      name: 'Hospitality Service',
      description: 'Restaurant booking and food delivery system',
    },
    {
      name: 'Real Estate Portal',
      description: 'Buy, rent, and sell properties',
    },
    {
      name: 'Healthcare System',
      description: 'Appointment booking and patient record management',
    },
    {
      name: 'Social Media App',
      description: 'Connect people, share posts, and chat messaging',
    },
  ];

  for (const t of defaultTopics) {
    const existing = await topicRepository.findOne({ where: { name: t.name } });
    if (!existing) {
      const topic = topicRepository.create(t);
      await topicRepository.save(topic);
    }
  }
  console.log('Created 7 Default Topics');

  console.log('Seed completed successfully!');
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});
