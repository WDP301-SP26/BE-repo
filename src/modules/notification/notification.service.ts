import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  async getMyNotifications(userId: string) {
    return this.notifRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async readNotification(userId: string, notifId: string) {
    const notif = await this.notifRepo.findOne({
      where: { id: notifId, user_id: userId },
    });
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }

    notif.is_read = true;
    return this.notifRepo.save(notif);
  }
}
