import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto, ChangePasswordDto, LoginDto } from './auth.dto';
import { AuthRequest, LoginRateGuard, OriginGuard, SessionGuard } from './auth.guards';

@ApiTags('auth')
@Controller('auth')
@UseGuards(OriginGuard)
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}
  @Post('login') @HttpCode(200) @UseGuards(LoginRateGuard)
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) response: Response): Promise<AuthResponseDto> {
    const result = await this.auth.login(input.username, input.password);
    this.setCookie(response, result.cookie);
    return result.response;
  }
  @Get('me') @UseGuards(SessionGuard) @ApiCookieAuth() @ApiOkResponse({ type: AuthResponseDto })
  me(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response): AuthResponseDto {
    response.setHeader('Cache-Control', 'no-store');
    return this.auth.response(request.auth);
  }
  @Post('change-password') @HttpCode(200) @UseGuards(SessionGuard, LoginRateGuard)
  @ApiCookieAuth() @ApiHeader({ name: 'x-csrf-token', required: true }) @ApiOkResponse({ type: AuthResponseDto })
  async changePassword(@Req() request: AuthRequest, @Body() input: ChangePasswordDto, @Res({ passthrough: true }) response: Response): Promise<AuthResponseDto> {
    const result = await this.auth.changePassword(request.auth, input.currentPassword, input.newPassword);
    this.setCookie(response, result.cookie);
    return result.response;
  }
  @Post('logout') @HttpCode(204) @UseGuards(SessionGuard)
  @ApiCookieAuth() @ApiHeader({ name: 'x-csrf-token', required: true }) @ApiNoContentResponse()
  async logout(@Req() request: AuthRequest, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.auth.logout(request.auth);
    response.clearCookie('devsure_session', this.cookieOptions());
  }
  private cookieOptions() {
    const secure = this.config.getOrThrow<boolean>('auth.secureCookies');
    // Web and API deploy to different subdomains in production (e.g. Railway),
    // so the session cookie needs SameSite=None to survive a cross-site fetch.
    // SameSite=None requires Secure, which only holds in production — local
    // dev keeps Lax.
    const sameSite: 'none' | 'lax' = secure ? 'none' : 'lax';
    return { httpOnly: true, sameSite, secure, path: '/' };
  }
  private setCookie(response: Response, value: string): void {
    response.setHeader('Cache-Control', 'no-store');
    response.cookie('devsure_session', value, { ...this.cookieOptions(), maxAge: this.config.getOrThrow<number>('auth.sessionTtlSeconds') * 1000 });
  }
}
