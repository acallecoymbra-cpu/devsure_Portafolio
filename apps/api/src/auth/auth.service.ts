import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import * as argon2 from 'argon2';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { AdminSession } from './entities/admin-session.entity';
import { AuthResponseDto } from './auth.dto';

export interface AuthContext { session: AdminSession; user: AdminUser; csrfToken: string }
export const digest = (value: string): string => createHash('sha256').update(value).digest('hex');
export function equalSecret(left: string, right: string): boolean {
  return timingSafeEqual(Buffer.from(digest(left)), Buffer.from(digest(right)));
}

@Injectable()
export class AuthService {
  private readonly dummyHash = argon2.hash(randomBytes(32), { type: argon2.argon2id });
  constructor(
    @InjectRepository(AdminUser) private readonly users: Repository<AdminUser>,
    @InjectRepository(AdminSession) private readonly sessions: Repository<AdminSession>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async login(username: string, password: string): Promise<{ cookie: string; response: AuthResponseDto }> {
    const user = await this.users.createQueryBuilder('user').addSelect('user.passwordHash')
      .where('user.username = :username', { username }).getOne();
    const valid = await argon2.verify(user?.passwordHash ?? await this.dummyHash, password);
    if (!valid || !user?.isActive) throw new UnauthorizedException();
    return this.issue(user, this.dataSource.manager);
  }

  async authenticate(cookie: string | undefined): Promise<AuthContext> {
    if (!cookie || !/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/.test(cookie)) throw new UnauthorizedException();
    const [selector, secret] = cookie.split('.');
    const session = await this.sessions.findOne({ where: { selector }, relations: { user: true } });
    if (!session || session.expiresAt.getTime() <= Date.now() || !session.user.isActive ||
      !equalSecret(session.tokenHash, digest(secret))) throw new UnauthorizedException();
    return { session, user: session.user, csrfToken: this.csrf(secret) };
  }

  response(context: AuthContext): AuthResponseDto {
    return { user: this.identity(context.user), csrfToken: context.csrfToken };
  }

  async logout(context: AuthContext): Promise<void> {
    await this.sessions.delete({ selector: context.session.selector });
  }

  async changePassword(context: AuthContext, currentPassword: string, newPassword: string): Promise<{ cookie: string; response: AuthResponseDto }> {
    const user = await this.users.createQueryBuilder('user').addSelect('user.passwordHash')
      .where('user.id = :id', { id: context.user.id }).getOneOrFail();
    if (!await argon2.verify(user.passwordHash, currentPassword)) throw new UnauthorizedException();
    if (currentPassword === newPassword) throw new BadRequestException();
    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    return this.dataSource.transaction(async (manager) => {
      // Conditional update prevents simultaneous changes from both accepting an old password.
      const result = await manager.update(AdminUser, { id: user.id, passwordHash: user.passwordHash }, { passwordHash, mustChangePassword: false });
      if (!result.affected) throw new UnauthorizedException();
      await manager.delete(AdminSession, { userId: user.id });
      user.mustChangePassword = false;
      return this.issue(user, manager);
    });
  }

  private csrf(secret: string): string {
    return createHmac('sha256', secret).update('devsure.csrf.v1').digest('base64url');
  }

  private identity(user: AdminUser): AuthResponseDto['user'] {
    return { id: user.id, username: user.username, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword };
  }

  private async issue(user: AdminUser, manager: EntityManager): Promise<{ cookie: string; response: AuthResponseDto }> {
    const selector = randomUUID();
    const secret = randomBytes(32).toString('base64url');
    const csrfToken = this.csrf(secret);
    await manager.save(AdminSession, manager.create(AdminSession, {
      selector, userId: user.id, tokenHash: digest(secret), csrfHash: digest(csrfToken),
      expiresAt: new Date(Date.now() + this.config.getOrThrow<number>('auth.sessionTtlSeconds') * 1000),
    }));
    return { cookie: `${selector}.${secret}`, response: { user: this.identity(user), csrfToken } };
  }
}
