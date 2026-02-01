import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { IntegrationProvider } from '@prisma/client';
import { Profile, Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GH_CLIENT_ID'),
      clientSecret: configService.get<string>('GH_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GH_CALLBACK_URL'),
      scope: ['user:email', 'read:user'],
      passReqToCallback: true,
    } as any); // Type assertion to bypass Passport typing issue
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ): Promise<any> {
    try {
      const providerId = profile.id;
      const oauthProfile = {
        id: providerId,
        username: profile.username,
        email: profile.emails?.[0]?.value,
        displayName: profile.displayName,
        photos: profile.photos,
      };

      // Scenario A: Check if this GitHub account is already linked
      const existingLink = await this.authService.findUserByOAuthProvider(
        IntegrationProvider.GITHUB,
        providerId,
      );

      if (existingLink) {
        // Login: Return the linked user
        return done(null, existingLink.user);
      }

      // Scenario B: Check if the user is already logged in (linking flow)
      const currentUser = request.user; // Set by OptionalJwtAuthGuard

      if (currentUser) {
        // Linking: Link this GitHub account to the current user
        await this.authService.linkOAuthAccount(
          currentUser.id,
          IntegrationProvider.GITHUB,
          oauthProfile,
          accessToken,
          refreshToken,
        );
        return done(null, currentUser);
      }

      // Scenario C: First-time OAuth user - Auto-create or redirect to register
      const user = await this.authService.findOrCreateOAuthUser(
        IntegrationProvider.GITHUB,
        oauthProfile,
        accessToken,
        refreshToken,
      );

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
}
