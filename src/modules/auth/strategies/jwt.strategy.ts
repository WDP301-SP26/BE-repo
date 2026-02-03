import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { Request } from 'express';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

export interface ValidatedUser {
  id: string;
  email: string;
  full_name: string | null;
  student_id: string | null;
  role: string;
  avatar_url: string | null;
  primary_provider: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Check Authorization header (for API calls)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Check cookie (for OAuth flow)
        (request: Request): string | null => {
          const token = request?.cookies?.['auth_token'] as unknown;
          return typeof token === 'string' ? token : null;
        },
        // 3. Fallback to query param (for testing only - not recommended for production)
        (request: Request): string | null => {
          const token = request?.query?.['token'];
          return typeof token === 'string' ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    };

    super(strategyOptions);
  }

  /**
   * Validate JWT payload and return user object
   * This method is automatically called by Passport after JWT verification
   * @param payload - Decoded JWT payload
   * @returns User object from database or throws UnauthorizedException
   */
  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    // Validate payload structure
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Fetch user from database
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        full_name: true,
        student_id: true,
        role: true,
        avatar_url: true,
        primary_provider: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    return user;
  }
}
