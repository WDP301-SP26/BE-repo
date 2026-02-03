import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: this.configService.get('REDIS_PORT') || 6379,
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  async setOAuthState(state: string, redirectUri: string): Promise<void> {
    await this.client.setex(`oauth:state:${state}`, 300, redirectUri); // 5 min TTL
  }

  async getOAuthState(state: string): Promise<string | null> {
    return await this.client.get(`oauth:state:${state}`);
  }

  async deleteOAuthState(state: string): Promise<void> {
    await this.client.del(`oauth:state:${state}`);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
