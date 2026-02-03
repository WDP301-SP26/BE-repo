import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

// Mock ioredis to avoid real Redis connection
jest.mock('ioredis', () => {
  const mockRedis = {
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'oauth:state:test-state-123') {
        return Promise.resolve('http://localhost:3000');
      }
      return Promise.resolve(null);
    }),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                REDIS_HOST: 'localhost',
                REDIS_PORT: 6379,
                REDIS_PASSWORD: undefined,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should store and retrieve OAuth state', async () => {
    const state = 'test-state-123';
    const redirectUri = 'http://localhost:3000';

    await service.setOAuthState(state, redirectUri);
    const result = await service.getOAuthState(state);

    expect(result).toBe(redirectUri);
  });

  it('should return null for expired/missing state', async () => {
    const result = await service.getOAuthState('non-existent');
    expect(result).toBeNull();
  });

  it('should delete OAuth state', async () => {
    const state = 'test-state-456';
    const redirectUri = 'http://localhost:3000';

    await service.setOAuthState(state, redirectUri);
    await service.deleteOAuthState(state);
    const result = await service.getOAuthState(state);

    expect(result).toBeNull();
  });
});
