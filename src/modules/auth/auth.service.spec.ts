import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthService,
  UserTokenPayloadDto,
  AuthResponse,
  LoginResponse,
} from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { IntegrationProvider, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConflictException, BadRequestException } from '@nestjs/common';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockPrismaService: jest.Mocked<PrismaService>;
  let mockHttpService: jest.Mocked<HttpService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      integrationToken: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
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
        {
          provide: ConfigService,
          useValue: mockConfigService,
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
      expect(service['configService']).toBeDefined();
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
    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'GH_CLIENT_ID') return 'test-client-id';
        if (key === 'GH_CLIENT_SECRET') return 'test-client-secret';
        return undefined;
      });
    });

    it('should throw error if GitHub OAuth is not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(
        service['handleGitHubCallback']('test_code'),
      ).rejects.toThrow('GitHub OAuth is not configured');
    });

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

  describe('findOrCreateOAuthUser', () => {
    it('should find existing user by OAuth token', async () => {
      const provider: IntegrationProvider = 'GITHUB';
      const providerUserId = 'github-uid-1';
      const providerEmail = 'test1@mail.test';
      const mockUser = {
        id: 'user-123',
        email: providerEmail,
        full_name: 'Test User',
        student_id: null,
        role: 'USER',
        created_at: new Date(),
      };

      const spyFindUserByOAuthProvider = jest.spyOn(
        service,
        'findOrCreateOAuthUser',
      );
      (spyFindUserByOAuthProvider as jest.Mock).mockResolvedValue(
        mockUser as User,
      );

      const spyFindToken = jest.spyOn(
        mockPrismaService.integrationToken,
        'findUnique',
      );
      (spyFindToken as jest.Mock).mockResolvedValue({
        id: 'token-123',
        provider: provider,
        provider_user_id: providerUserId,
        user_id: mockUser.id,
      });
      const spyFindUser = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyFindUser as jest.Mock).mockResolvedValue(mockUser);
      const spyCreateUser = jest.spyOn(mockPrismaService.user, 'create');
      expect(spyCreateUser).not.toHaveBeenCalled();
      const user = await service.findOrCreateOAuthUser(
        provider,
        {
          id: providerUserId,
          email: providerEmail,
          username: 'Test User',
        },
        'valid_access_token',
      );
      expect(user).toEqual(mockUser);
    });

    it('should create new user if not found by OAuth token', async () => {
      const provider: IntegrationProvider = 'GITHUB';
      const providerUserId = 'github-uid-2';
      const providerEmail = 'test2@mail.test';
      const mockNewUser = {
        id: 'user-456',
        email: providerEmail,
        full_name: 'New User',
        student_id: null,
        role: 'USER',
        created_at: new Date(),
      };
      const spyFindToken = jest.spyOn(
        mockPrismaService.integrationToken,
        'findUnique',
      );
      (spyFindToken as jest.Mock).mockResolvedValue(null);
      const spyFindUser = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyFindUser as jest.Mock).mockResolvedValue(null);
      const spyCreateUser = jest.spyOn(mockPrismaService.user, 'create');
      (spyCreateUser as jest.Mock).mockResolvedValue(mockNewUser);
      const user = await service.findOrCreateOAuthUser(
        provider,
        {
          id: providerUserId,
          email: providerEmail,
          username: 'New User',
        },
        'valid_access_token',
      );
      expect(user).toEqual(mockNewUser);
    });
  });

  describe('linkOAuthAccount', () => {
    it('should update existing OAuth link if already linked', async () => {
      const userId = 'user-123';
      const provider: IntegrationProvider = 'GITHUB';
      const profile = {
        id: 'github-uid-1',
        username: 'githubuser',
        email: 'test1@mail.test',
        displayName: 'GitHub User',
      };
      const accessToken = 'new_access_token';
      const refreshToken = 'new_refresh_token';

      const existingLink = {
        id: 'token-123',
        user_id: userId,
        provider: provider,
        provider_user_id: 'old-github-uid',
        provider_username: 'oldusername',
        provider_email: 'old@mail.test',
        access_token: 'old_access_token',
        refresh_token: 'old_refresh_token',
        used_for_login: true,
        created_at: new Date(),
      };

      const updatedLink = {
        ...existingLink,
        provider_user_id: profile.id,
        provider_username: profile.username,
        provider_email: profile.email,
        access_token: accessToken,
        refresh_token: refreshToken,
        last_refreshed_at: new Date(),
      };

      const spyFindUnique = jest.spyOn(
        mockPrismaService.integrationToken,
        'findUnique',
      );
      (spyFindUnique as jest.Mock).mockResolvedValue(existingLink);

      const spyUpdate = jest.spyOn(
        mockPrismaService.integrationToken,
        'update',
      );
      (spyUpdate as jest.Mock).mockResolvedValue(updatedLink);

      const result = await service.linkOAuthAccount(
        userId,
        provider,
        profile,
        accessToken,
        refreshToken,
      );

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: {
          user_id_provider: {
            user_id: userId,
            provider,
          },
        },
      });

      expect(spyUpdate).toHaveBeenCalledWith({
        where: { id: existingLink.id },
        data: {
          provider_user_id: profile.id,
          provider_username: profile.username,
          provider_email: profile.email,
          access_token: accessToken,
          refresh_token: refreshToken,
          used_for_login: true,
          last_refreshed_at: expect.any(Date) as Date,
        },
      });

      expect(result).toEqual(updatedLink);
    });

    it('should create new OAuth link if not already linked', async () => {
      const userId = 'user-456';
      const provider: IntegrationProvider = 'GITHUB';
      const profile = {
        id: 'github-uid-2',
        username: 'newuser',
        email: 'newuser@mail.test',
        displayName: 'New User',
      };
      const accessToken = 'new_access_token';
      const refreshToken = 'new_refresh_token';

      const createdLink = {
        id: 'token-456',
        user_id: userId,
        provider: provider,
        provider_user_id: profile.id,
        provider_username: profile.username,
        provider_email: profile.email,
        access_token: accessToken,
        refresh_token: refreshToken,
        used_for_login: true,
        created_at: new Date(),
      };

      const spyFindUnique = jest.spyOn(
        mockPrismaService.integrationToken,
        'findUnique',
      );
      (spyFindUnique as jest.Mock).mockResolvedValue(null);

      const spyCreate = jest.spyOn(
        mockPrismaService.integrationToken,
        'create',
      );
      (spyCreate as jest.Mock).mockResolvedValue(createdLink);

      const result = await service.linkOAuthAccount(
        userId,
        provider,
        profile,
        accessToken,
        refreshToken,
      );

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: {
          user_id_provider: {
            user_id: userId,
            provider,
          },
        },
      });

      expect(spyCreate).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          provider,
          provider_user_id: profile.id,
          provider_username: profile.username,
          provider_email: profile.email,
          access_token: accessToken,
          refresh_token: refreshToken,
          used_for_login: true,
        },
      });

      expect(result).toEqual(createdLink);
    });

    it('should handle linking without refresh token', async () => {
      const userId = 'user-789';
      const provider: IntegrationProvider = 'GITHUB';
      const profile = {
        id: 'github-uid-3',
        username: 'usernorefresh',
        email: 'norefresh@mail.test',
      };
      const accessToken = 'access_token_only';

      const createdLink = {
        id: 'token-789',
        user_id: userId,
        provider: provider,
        provider_user_id: profile.id,
        provider_username: profile.username,
        provider_email: profile.email,
        access_token: accessToken,
        refresh_token: undefined,
        used_for_login: true,
        created_at: new Date(),
      };

      const spyFindUnique = jest.spyOn(
        mockPrismaService.integrationToken,
        'findUnique',
      );
      (spyFindUnique as jest.Mock).mockResolvedValue(null);

      const spyCreate = jest.spyOn(
        mockPrismaService.integrationToken,
        'create',
      );
      (spyCreate as jest.Mock).mockResolvedValue(createdLink);

      const result = await service.linkOAuthAccount(
        userId,
        provider,
        profile,
        accessToken,
      );

      expect(spyCreate).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          provider,
          provider_user_id: profile.id,
          provider_username: profile.username,
          provider_email: profile.email,
          access_token: accessToken,
          refresh_token: undefined,
          used_for_login: true,
        },
      });

      expect(result).toEqual(createdLink);
    });
  });

  describe('findUserByOAuthProvider', () => {
    it('should find integration with user by OAuth provider', async () => {
      const provider: IntegrationProvider = 'GITHUB';
      const providerId = 'github-uid-123';

      const mockUser = {
        id: 'user-123',
        email: 'test1@mail.test',
        full_name: 'Test User',
        student_id: null,
        role: 'USER',
        created_at: new Date(),
      };

      const mockIntegration = {
        id: 'token-123',
        user_id: mockUser.id,
        provider: provider,
        provider_user_id: providerId,
        provider_username: 'testuser',
        provider_email: 'test1@mail.test',
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        used_for_login: true,
        created_at: new Date(),
        user: mockUser,
      };

      const spyFindUnique = jest.spyOn(
        mockPrismaService.integrationToken,
        'findUnique',
      );
      (spyFindUnique as jest.Mock).mockResolvedValue(mockIntegration);

      const result = await service.findUserByOAuthProvider(
        provider,
        providerId,
      );

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: {
          provider_provider_user_id: {
            provider,
            provider_user_id: providerId,
          },
        },
        include: {
          user: true,
        },
      });

      expect(result).toEqual(mockIntegration);
      expect(result?.user).toEqual(mockUser);
    });

    it('should return null if integration not found', async () => {
      const provider: IntegrationProvider = 'GITHUB';
      const providerId = 'non-existent-uid';

      const spyFindUnique = jest.spyOn(
        mockPrismaService.integrationToken,
        'findUnique',
      );
      (spyFindUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findUserByOAuthProvider(
        provider,
        providerId,
      );

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: {
          provider_provider_user_id: {
            provider,
            provider_user_id: providerId,
          },
        },
        include: {
          user: true,
        },
      });

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'newuser@mail.test',
        password: 'password123',
        fullName: 'New User',
        studentId: 'S123456',
      };

      const hashedPassword = 'hashed_password_123';
      const mockCreatedUser: UserTokenPayloadDto = {
        id: 'user-new',
        email: registerDto.email,
        full_name: registerDto.fullName,
        student_id: registerDto.studentId,
        role: 'USER',
        created_at: new Date(),
      };

      const expectedToken = 'jwt-token-123';
      const expectedResponse: AuthResponse = {
        user: mockCreatedUser,
        access_token: expectedToken,
      };

      const spyFindUnique = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyFindUnique as jest.Mock).mockResolvedValue(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const spyCreate = jest.spyOn(mockPrismaService.user, 'create');
      (spyCreate as jest.Mock).mockResolvedValue(mockCreatedUser);

      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.register(registerDto);

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);

      expect(spyCreate).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password_hash: hashedPassword,
          full_name: registerDto.fullName,
          student_id: registerDto.studentId,
          primary_provider: 'EMAIL',
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          student_id: true,
          role: true,
          created_at: true,
        },
      });

      expect(result).toEqual(expectedResponse);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('access_token');
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@mail.test',
        password: 'password123',
        fullName: 'Existing User',
        studentId: 'S999999',
      };

      const existingUser = {
        id: 'existing-user-id',
        email: registerDto.email,
      };

      const spyFindUnique = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyFindUnique as jest.Mock).mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email này đã được sử dụng!',
      );

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const loginDto = {
        email: 'user@mail.test',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: loginDto.email,
        full_name: 'Test User',
        student_id: 'S123456',
        role: 'USER',
        password_hash: 'hashed_password',
        created_at: new Date(),
        last_login: null,
      };

      const expectedToken = 'jwt-token-456';
      const expectedResponse: LoginResponse = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          full_name: mockUser.full_name,
          student_id: mockUser.student_id,
          role: mockUser.role,
        },
        access_token: expectedToken,
      };

      const spyValidateUser = jest.spyOn(service, 'validateUser');
      (spyValidateUser as jest.Mock).mockResolvedValue(mockUser);

      const spyUpdate = jest.spyOn(mockPrismaService.user, 'update');
      (spyUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        last_login: new Date(),
      });

      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(loginDto);

      expect(spyValidateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );

      expect(spyUpdate).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { last_login: expect.any(Date) as Date },
      });

      expect(result).toEqual(expectedResponse);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('access_token');
      expect(result.user).not.toHaveProperty('created_at');
    });

    it('should throw BadRequestException if credentials are invalid', async () => {
      const loginDto = {
        email: 'user@mail.test',
        password: 'wrong_password',
      };

      const spyValidateUser = jest.spyOn(service, 'validateUser');
      (spyValidateUser as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Email hoặc mật khẩu không đúng',
      );

      expect(spyValidateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const email = 'user@mail.test';
      const password = 'password123';
      const mockUser = {
        id: 'user-123',
        email: email,
        password_hash: 'hashed_password',
        full_name: 'Test User',
        student_id: 'S123456',
        role: 'USER',
        created_at: new Date(),
      };

      const spyFindUnique = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyFindUnique as jest.Mock).mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: { email },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        password,
        mockUser.password_hash,
      );

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@mail.test';
      const password = 'password123';

      const spyFindUnique = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyFindUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: { email },
      });

      expect(result).toBeNull();
    });

    it('should return null if user has no password hash (OAuth user)', async () => {
      const email = 'oauth@mail.test';
      const password = 'password123';
      const mockOAuthUser = {
        id: 'user-oauth',
        email: email,
        password_hash: null,
        full_name: 'OAuth User',
        role: 'USER',
      };

      const spyFindUnique = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyFindUnique as jest.Mock).mockResolvedValue(mockOAuthUser);

      const result = await service.validateUser(email, password);

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: { email },
      });

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      const email = 'user@mail.test';
      const password = 'wrong_password';
      const mockUser = {
        id: 'user-123',
        email: email,
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'USER',
      };

      const spyFindUnique = jest.spyOn(mockPrismaService.user, 'findUnique');
      (spyFindUnique as jest.Mock).mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(spyFindUnique).toHaveBeenCalledWith({
        where: { email },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        password,
        mockUser.password_hash,
      );

      expect(result).toBeNull();
    });
  });
});
