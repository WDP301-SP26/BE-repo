import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { IntegrationProvider } from '@prisma/client';

/**
 * Jira/Atlassian OAuth 2.0 (3LO) Strategy
 * Using passport-oauth2 since passport-atlassian packages may be outdated
 */
@Injectable()
export class JiraStrategy extends PassportStrategy(Strategy, 'jira') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      authorizationURL: 'https://auth.atlassian.com/authorize',
      tokenURL: 'https://auth.atlassian.com/oauth/token',
      clientID: configService.get<string>('JIRA_CLIENT_ID'),
      clientSecret: configService.get<string>('JIRA_CLIENT_SECRET'),
      callbackURL: configService.get<string>('JIRA_CALLBACK_URL'),
      scope: ['read:me', 'offline_access'],
      passReqToCallback: true,
    } as any); // Type assertion to bypass Passport typing issue
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    params: any,
    profile: any,
    done: any,
  ): Promise<any> {
    try {
      // Atlassian doesn't return profile automatically, we need to fetch it
      const userInfo = await this.getAtlassianUserInfo(accessToken);

      const providerId = userInfo.account_id;
      const oauthProfile = {
        id: providerId,
        username: userInfo.name,
        email: userInfo.email,
        displayName: userInfo.name,
        photos: userInfo.picture ? [{ value: userInfo.picture }] : undefined,
      };

      // Scenario A: Check if this Jira account is already linked
      const existingLink = await this.authService.findUserByOAuthProvider(
        IntegrationProvider.JIRA,
        providerId,
      );

      if (existingLink) {
        // Login: Return the linked user
        return done(null, existingLink.user);
      }

      // Scenario B: Check if the user is already logged in (linking flow)
      const currentUser = request.user; // Set by OptionalJwtAuthGuard

      if (currentUser) {
        // Linking: Link this Jira account to the current user
        await this.authService.linkOAuthAccount(
          currentUser.id,
          IntegrationProvider.JIRA,
          oauthProfile,
          accessToken,
          refreshToken,
        );
        return done(null, currentUser);
      }

      // Scenario C: First-time OAuth user - Auto-create
      const user = await this.authService.findOrCreateOAuthUser(
        IntegrationProvider.JIRA,
        oauthProfile,
        accessToken,
        refreshToken,
      );

      return done(null, user);
    } catch (error) {
      console.error('Jira OAuth error:', error);
      return done(error, false);
    }
  }

  /**
   * Fetch Atlassian user info using access token
   */
  private async getAtlassianUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://api.atlassian.com/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Atlassian user info');
    }

    return response.json();
  }
}
