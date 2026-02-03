import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, IntegrationProvider, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { HttpService } from '@nestjs/axios';

export interface OAuthProfile {
  id: string; // Provider's user ID
  username?: string;
  email?: string;
  displayName?: string;
  photos?: Array<{ value: string }>;
}

export interface UserTokenPayloadDto {
  id: string;
  email: string;
  full_name: string | null;
  student_id: string | null;
  role: string;
  created_at: Date;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface GitHubUserEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private httpService: HttpService,
  ) {}

  // ============ Email/Password Authentication ============

  async register(registerDto: RegisterDto) {
    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng!');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user: UserTokenPayloadDto = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password_hash: hashedPassword,
        full_name: registerDto.fullName,
        student_id: registerDto.studentId,
        primary_provider: AuthProvider.EMAIL,
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

    return {
      user,
      access_token: this.generateJwtToken(user),
    };
  }

  async login(loginDto: LoginDto) {
    const user: User | null = await this.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new BadRequestException('Email hoặc mật khẩu không đúng');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const userTokenPayloadDto: UserTokenPayloadDto = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      student_id: user.student_id,
      role: user.role,
      created_at: user.created_at,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        student_id: user.student_id,
        role: user.role,
      },
      access_token: this.generateJwtToken(userTokenPayloadDto),
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password_hash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // ============ OAuth Account Linking ============

  /**
   * Find user by OAuth provider
   */
  async findUserByOAuthProvider(
    provider: IntegrationProvider,
    providerId: string,
  ) {
    const integration = await this.prisma.integrationToken.findUnique({
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

    return integration;
  }

  /**
   * Link an OAuth account to an existing user
   */
  async linkOAuthAccount(
    userId: string,
    provider: IntegrationProvider,
    profile: OAuthProfile,
    accessToken: string,
    refreshToken?: string,
  ) {
    // Check if this provider is already linked to this user
    const existingLink = await this.prisma.integrationToken.findUnique({
      where: {
        user_id_provider: {
          user_id: userId,
          provider,
        },
      },
    });

    if (existingLink) {
      // Update existing link
      return this.prisma.integrationToken.update({
        where: { id: existingLink.id },
        data: {
          provider_user_id: profile.id,
          provider_username: profile.username,
          provider_email: profile.email,
          access_token: accessToken,
          refresh_token: refreshToken,
          used_for_login: true,
          last_refreshed_at: new Date(),
        },
      });
    }

    // Create new link
    return this.prisma.integrationToken.create({
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
  }

  /**
   * Find or create user from OAuth profile
   * Used when user logs in with OAuth for the first time
   */
  async findOrCreateOAuthUser(
    provider: IntegrationProvider,
    profile: OAuthProfile,
    accessToken: string,
    refreshToken?: string,
  ): Promise<User> {
    // Check if this OAuth account is already linked
    const existingIntegration = await this.findUserByOAuthProvider(
      provider,
      profile.id,
    );

    if (existingIntegration) {
      return existingIntegration.user;
    }

    // Check if a user with this email exists
    if (profile.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        // Auto-link this OAuth account to the existing user
        await this.linkOAuthAccount(
          existingUser.id,
          provider,
          profile,
          accessToken,
          refreshToken,
        );
        return existingUser;
      }
    }

    // Create a new user from OAuth profile
    const newUser = await this.prisma.user.create({
      data: {
        email:
          profile.email ||
          `${provider.toLowerCase()}_${profile.id}@placeholder.local`,
        full_name: profile.displayName || profile.username || 'User',
        avatar_url: profile.photos?.[0]?.value,
        primary_provider:
          provider === IntegrationProvider.GITHUB
            ? AuthProvider.GITHUB
            : AuthProvider.JIRA,
        password_hash: null, // OAuth users don't have password
      },
    });

    // Link the OAuth account
    await this.linkOAuthAccount(
      newUser.id,
      provider,
      profile,
      accessToken,
      refreshToken,
    );

    return newUser;
  }

  /**
   * Unlink an OAuth provider from a user
   */
  async unlinkOAuthAccount(userId: string, provider: IntegrationProvider) {
    const integration = await this.prisma.integrationToken.findUnique({
      where: {
        user_id_provider: {
          user_id: userId,
          provider,
        },
      },
    });

    if (!integration) {
      throw new BadRequestException('Tài khoản này chưa được liên kết');
    }

    await this.prisma.integrationToken.delete({
      where: { id: integration.id },
    });

    return { message: 'Đã hủy liên kết thành công' };
  }

  // ============ GitHub OAuth Manual Flow ============

  async handleGitHubCallback(code: string) {
    const clientId = process.env.GH_CLIENT_ID;
    const clientSecret = process.env.GH_CLIENT_SECRET;

    try {
      // Step 1: Exchange code for access token
      const tokenResponse =
        await this.httpService.axiosRef.post<GitHubTokenResponse>(
          'https://github.com/login/oauth/access_token',
          {
            client_id: clientId,
            client_secret: clientSecret,
            code,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );

      const tokenData: GitHubTokenResponse = tokenResponse.data;

      if (!tokenData.access_token) {
        throw new BadRequestException('Failed to exchange code for token');
      }

      // Step 2: Fetch user profile from GitHub
      const profileResponse =
        await this.httpService.axiosRef.get<GitHubUserProfile>(
          'https://api.github.com/user',
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              Accept: 'application/vnd.github+json',
            },
          },
        );

      const profile: GitHubUserProfile = profileResponse.data;

      // Step 3: Fetch user emails
      const emailResponse = await this.httpService.axiosRef.get<
        GitHubUserEmail[]
      >('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github+json',
        },
      });

      const emails = emailResponse.data;
      const primaryEmail = emails.find(
        (e: GitHubUserEmail) => e.primary,
      )!.email;

      // Step 4: Create OAuth profile
      const oauthProfile = {
        id: String(profile.id),
        username: profile.login,
        email: primaryEmail,
        displayName: profile.name,
        photos: profile.avatar_url ? [{ value: profile.avatar_url }] : [],
      };

      // Step 5: Find or create user
      const user = await this.findOrCreateOAuthUser(
        IntegrationProvider.GITHUB,
        oauthProfile,
        tokenData.access_token,
        tokenData.refresh_token,
      );

      return user;
    } catch (error) {
      const serviceName = this.constructor.name;
      const methodName = this.handleGitHubCallback.name;
      console.error(`[${serviceName} - ${methodName}]`, error);
      throw new BadRequestException('GitHub OAuth failed. Please try again.');
    }
  }

  // ============ JWT Token Generation ============

  generateJwtToken(user: UserTokenPayloadDto) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Get user's linked OAuth accounts
   */
  async getLinkedAccounts(userId: string) {
    return this.prisma.integrationToken.findMany({
      where: {
        user_id: userId,
        used_for_login: true,
      },
      select: {
        provider: true,
        provider_username: true,
        provider_email: true,
        created_at: true,
      },
    });
  }
}
