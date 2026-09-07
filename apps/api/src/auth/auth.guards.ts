import { CanActivate, ExecutionContext, ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthContext, AuthService, equalSecret } from './auth.service';

export interface AuthRequest extends Request { auth: AuthContext }
export function sessionCookie(request: Request): string | undefined {
  return request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('devsure_session='))?.slice('devsure_session='.length);
}
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;
    if (!this.config.getOrThrow<string[]>('http.corsOrigins').includes(request.get('origin') ?? '')) throw new ForbiddenException();
    return true;
  }
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    request.auth = await this.auth.authenticate(sessionCookie(request));
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      !equalSecret(request.get('x-csrf-token') ?? '', request.auth.csrfToken)) throw new ForbiddenException();
    return true;
  }
}
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<AuthRequest>().auth;
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    if (user.mustChangePassword) throw new ForbiddenException({ code: 'PASSWORD_CHANGE_REQUIRED' });
    return true;
  }
}
@Injectable()
export class LoginRateGuard implements CanActivate {
  private readonly attempts = new Map<string, { count: number; expires: number }>();
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    for (const [key, value] of this.attempts) if (value.expires <= now) this.attempts.delete(key);
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    let entry = this.attempts.get(key);
    if (!entry) {
      if (this.attempts.size >= 10000) throw new HttpException('Too many requests', 429);
      entry = { count: 0, expires: now + this.config.getOrThrow<number>('auth.loginWindowSeconds') * 1000 };
      this.attempts.set(key, entry);
    }
    if (++entry.count > this.config.getOrThrow<number>('auth.loginMaxAttempts')) throw new HttpException('Too many requests', 429);
    return true;
  }
}
