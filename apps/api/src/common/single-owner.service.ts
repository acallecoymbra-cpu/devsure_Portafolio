import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';

/**
 * Public (unauthenticated) endpoints have no `ownerId` from a session, but
 * this CMS is single-owner: every public read resolves "the" owner as the
 * earliest-created admin. Shared by `PortfolioService` and the public
 * projects endpoints so this lookup lives in exactly one place.
 */
@Injectable()
export class SingleOwnerService {
  constructor(@InjectRepository(AdminUser) private readonly users: Repository<AdminUser>) {}

  async resolve(): Promise<string> {
    const [owner] = await this.users.find({ order: { createdAt: 'ASC' }, take: 1 });
    if (!owner) throw new NotFoundException();
    return owner.id;
  }
}
