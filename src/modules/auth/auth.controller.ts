import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { GitHubOAuthGuard } from './guards/github-oauth.guard';
import { JiraOAuthGuard } from './guards/jira-oauth.guard';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ============ Email/Password Authentication ============

  @Post('register')
  @ApiOperation({ summary: 'Register new user with email and password' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
  })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // ============ GitHub OAuth ============

  @Get('github')
  @UseGuards(OptionalJwtAuthGuard, GitHubOAuthGuard)
  @ApiOperation({
    summary: 'Initiate GitHub OAuth flow (❌ Do not use "Try it out")',
    description:
      '<b>Note:</b> Do not use the "Try it out" button here. It will fail with a CORS error because it tries to fetch the GitHub login page. <br />👉 <b>Open this URL in a new browser tab instead:</b> <a href="/api/auth/github" target="_blank">/api/auth/github</a>',
  })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
  async githubAuth() {
    // Guard redirects to GitHub OAuth
  }

  @Get('github/callback')
  @UseGuards(OptionalJwtAuthGuard, GitHubOAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth callback (internal use)' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  // TODO: Fix this endpoint so it calls AuthService and returns user data + token
  githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    const token = this.authService.generateJwtToken(user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  // ============ Jira OAuth ============

  @Get('jira')
  @UseGuards(OptionalJwtAuthGuard, JiraOAuthGuard)
  @ApiOperation({
    summary: 'Initiate Jira/Atlassian OAuth flow (❌ Do not use "Try it out")',
    description:
      '<b>Note:</b> Do not use the "Try it out" button here. It will fail with a CORS error because it tries to fetch the Jira login page. <br />👉 <b>Open this URL in a new browser tab instead:</b> <a href="/api/auth/jira" target="_blank">/api/auth/jira</a>',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Jira OAuth' })
  async jiraAuth() {
    // Guard redirects to Jira OAuth
  }

  @Get('jira/callback')
  @UseGuards(OptionalJwtAuthGuard, JiraOAuthGuard)
  @ApiOperation({ summary: 'Jira OAuth callback (internal use)' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  // TODO: Fix this endpoint so it calls AuthService and returns user data + token
  jiraCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    const token = this.authService['generateJwtToken'](user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  // ============ Account Management ============

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  // TODO: Fix this endpoint to return proper user data using JWT
  getCurrentUser(@Req() req: Request) {
    return req.user;
  }

  @Get('linked-accounts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all linked OAuth accounts' })
  @ApiResponse({ status: 200, description: 'Returns list of linked accounts' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLinkedAccounts(@Req() req: any) {
    return await this.authService.getLinkedAccounts(req.user.id);
  }

  @Delete('unlink/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink an OAuth provider' })
  @ApiParam({ name: 'provider', enum: ['GITHUB', 'JIRA'] })
  @ApiResponse({ status: 200, description: 'Provider unlinked successfully' })
  @ApiResponse({ status: 400, description: 'Provider not linked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unlinkAccount(@Req() req: any, @Param('provider') provider: string) {
    const providerEnum = provider.toUpperCase();
    return await this.authService.unlinkOAuthAccount(
      req.user.id,
      providerEnum as any,
    );
  }
}
