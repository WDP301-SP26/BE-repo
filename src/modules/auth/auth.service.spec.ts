import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, UserTokenPayloadDto } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { IntegrationProvider, User } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockPrismaService: jest.Mocked<PrismaService>;
  let mockHttpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      integrationToken: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;
    mockHttpService = {
      axiosRef: {
        get: jest.fn(),
        post: jest.fn(),
      },
    } as unknown as jest.Mocked<HttpService>;

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = app.get<AuthService>(AuthService);
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have necessary injections', () => {
      expect(service['jwtService']).toBeDefined();
      expect(service['prisma']).toBeDefined();
    });
  });

  describe('generateJwtToken', () => {
    it('should generate a JWT token with correct payload', () => {
      const user: UserTokenPayloadDto = {
        id: '1',
        full_name: 'Test User',
        email: 'test1@mail.test',
        student_id: 'S123456',
        role: 'USER',
        created_at: new Date(),
      };
      const expectedPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const expectedToken = 'mocked-jwt-token';

      mockJwtService.sign.mockReturnValue(expectedToken);
      const token = service['generateJwtToken'](user);
      expect(token).toBe(expectedToken);
      const spyJwtSign = jest.spyOn(mockJwtService, 'sign');
      expect(spyJwtSign).toHaveBeenCalledWith(expectedPayload);
    });
  });

  describe('getLinkedAccounts', () => {
    it('should return linked accounts for a user', async () => {
      const userId = '1';
      const mockLinkedAccounts = [
        {
          id: 'la1',
          provider: 'google',
          provider_user_id: 'google-uid-1',
          user_id: userId,
        },
        {
          id: 'la2',
          provider: 'github',
          provider_user_id: 'github-uid-1',
          user_id: userId,
        },
      ];
      const spyfindUser = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyfindUser as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'test1@mail.test',
      });
      const spyFindTokens = jest.spyOn(
        mockPrismaService.integrationToken,
        'findMany',
      );
      (spyFindTokens as jest.Mock).mockResolvedValue(mockLinkedAccounts);
      const linkedAccounts = await service.getLinkedAccounts(userId);
      expect(linkedAccounts).toEqual(mockLinkedAccounts);
      expect(spyFindTokens).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          used_for_login: true,
        },
        select: {
          created_at: true,
          provider: true,
          provider_email: true,
          provider_username: true,
        },
      });
    });

    it('should return empty array if no linked accounts found', async () => {
      const userId = '2';
      const spyfindUser = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyfindUser as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'test2@mail.test',
      });
      const spyFindTokens = jest.spyOn(
        mockPrismaService.integrationToken,
        'findMany',
      );
      (spyFindTokens as jest.Mock).mockResolvedValue([]);
      const linkedAccounts = await service.getLinkedAccounts(userId);
      expect(linkedAccounts).toEqual([]);
    });
  });

  describe('handleGitHubCallback', () => {
    it('should throw error if fetch access token fails', async () => {
      const spyErrorLog = jest.spyOn(console, 'error').mockImplementation();
      const spyPost = jest.spyOn(mockHttpService.axiosRef, 'post');
      (spyPost as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        service['handleGitHubCallback']('invalid_code'),
      ).rejects.toThrow('GitHub OAuth failed. Please try again.');

      expect(spyPost).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.any(Object),
        expect.any(Object),
      );

      expect(spyErrorLog).toHaveBeenCalledWith(
        '[AuthService - handleGitHubCallback]',
        expect.any(Error),
      );

      spyErrorLog.mockRestore();
    });

    it('should throw error if fetch user profile fails', async () => {
      const spyErrorLog = jest.spyOn(console, 'error').mockImplementation();
      const spyGet = jest.spyOn(mockHttpService.axiosRef, 'get');
      const spyPost = jest.spyOn(mockHttpService.axiosRef, 'post');
      (spyPost as jest.Mock).mockResolvedValue({
        data: {
          access_token: 'valid_access_token',
        },
      });
      (spyGet as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        service['handleGitHubCallback']('valid_code'),
      ).rejects.toThrow('GitHub OAuth failed. Please try again.');

      expect(spyGet).toHaveBeenCalledWith(
        'https://api.github.com/user',
        expect.any(Object),
      );

      expect(spyErrorLog).toHaveBeenCalledWith(
        '[AuthService - handleGitHubCallback]',
        expect.any(Error),
      );

      spyErrorLog.mockRestore();
    });

    it('should throw error if fetch user emails fails', async () => {
      const spyErrorLog = jest.spyOn(console, 'error').mockImplementation();
      const spyGet = jest.spyOn(mockHttpService.axiosRef, 'get');
      const spyPost = jest.spyOn(mockHttpService.axiosRef, 'post');
      (spyPost as jest.Mock).mockResolvedValue({
        data: {
          access_token: 'valid_access_token',
        },
      });
      (spyGet as jest.Mock)
        .mockResolvedValueOnce({
          data: {
            id: 12345,
            login: 'githubuser',
            name: 'GitHub User',
            email: null,
          },
        })
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service['handleGitHubCallback']('valid_code'),
      ).rejects.toThrow('GitHub OAuth failed. Please try again.');
      expect(spyGet).toHaveBeenCalledWith(
        'https://api.github.com/user/emails',
        expect.any(Object),
      );
      expect(spyErrorLog).toHaveBeenCalledWith(
        '[AuthService - handleGitHubCallback]',
        expect.any(Error),
      );
    });

    it('should successfully handle GitHub callback', async () => {
      const spyGet = jest.spyOn(mockHttpService.axiosRef, 'get');
      const spyPost = jest.spyOn(mockHttpService.axiosRef, 'post');

      (spyPost as jest.Mock).mockResolvedValue({
        data: {
          access_token: 'valid_access_token',
        },
      });

      (spyGet as jest.Mock).mockResolvedValueOnce({
        data: {
          id: 12345,
          login: 'githubuser',
          name: 'GitHub User',
          email: null,
          avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
        },
      });

      (spyGet as jest.Mock).mockResolvedValueOnce({
        data: [
          {
            email: 'test1@mail.test',
            primary: true,
            verified: true,
            visibility: 'public',
          },
        ],
      });

      const mockUser = {
        id: 'user-123',
        email: 'test1@mail.test',
        full_name: 'GitHub User',
        student_id: null,
        role: 'USER',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
        created_at: new Date(),
      };

      const spyFindOrCreate = jest
        .spyOn(service, 'findOrCreateOAuthUser')
        .mockResolvedValue(mockUser as User);

      const user = await service['handleGitHubCallback']('valid_code');

      expect(user).toEqual(mockUser);
      expect(spyFindOrCreate).toHaveBeenCalled();
    });
  });

  describe('unlinkOAuthAccount', () => {
    it('should unlink an OAuth account successfully', async () => {
      const userId = 'user-123';
      const provider: IntegrationProvider = 'GITHUB';
      const spyDelete = jest.spyOn(
        mockPrismaService.integrationToken,
        'delete',
      );
      (spyDelete as jest.Mock).mockResolvedValue({ count: 1 });
      const spyFindUnique = jest.spyOn(
        mockPrismaService.integrationToken,
        'findUnique',
      );
      (spyFindUnique as jest.Mock).mockResolvedValue({
        id: 'token-123',
        provider: provider,
        provider_user_id: 'github-uid-1',
        user_id: userId,
      });
      await service.unlinkOAuthAccount(userId, provider);
      expect(spyDelete).toHaveBeenCalledWith({
        where: {
          id: 'token-123',
        },
      });
    });

    it('should throw error if trying to unlink non-linked account', async () => {
      const userId = 'user-123';
      const provider: IntegrationProvider = 'GITHUB';
      const spyFindUnique = jest.spyOn(
        mockPrismaService.integrationToken,
        'findUnique',
      );
      (spyFindUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.unlinkOAuthAccount(userId, provider),
      ).rejects.toThrow('Tài khoản này chưa được liên kết');
    });
  });
});
