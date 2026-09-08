import type { Profile as ProfileContract } from '@devsure/contracts';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/profile.dto';
import { profileDefaults } from './profile.defaults';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    @InjectRepository(AdminUser) private readonly users: Repository<AdminUser>,
    private readonly dataSource: DataSource,
  ) {}

  async get(ownerId: string): Promise<ProfileContract> {
    const user = await this.users.findOneByOrFail({ id: ownerId });
    const profile = await this.getOrCreate(this.dataSource.manager, ownerId, user.username);
    return toProfile(user, profile);
  }

  async update(ownerId: string, input: UpdateProfileDto): Promise<ProfileContract> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOneByOrFail(AdminUser, { id: ownerId });
      const profile = await this.getOrCreate(manager, ownerId, user.username);

      if (input.email !== undefined && input.email !== user.email) {
        user.email = input.email;
        try {
          await manager.save(AdminUser, user);
        } catch (error) {
          if (error instanceof QueryFailedError && /unique/i.test(error.message)) throw new ConflictException();
          throw error;
        }
      }

      manager.merge(Profile, profile, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.headline !== undefined ? { headline: input.headline } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
        ...(input.resume !== undefined ? { resume: input.resume } : {}),
        ...(input.stats !== undefined ? { stats: input.stats } : {}),
        ...(input.activeLocales !== undefined ? { activeLocales: input.activeLocales } : {}),
        ...(input.defaultLocale !== undefined ? { defaultLocale: input.defaultLocale } : {}),
      });

      if (!profile.activeLocales.includes(profile.defaultLocale)) {
        throw new BadRequestException('defaultLocale must be included in activeLocales');
      }

      const saved = await manager.save(Profile, profile);
      return toProfile(user, saved);
    });
  }

  private async getOrCreate(manager: EntityManager, ownerId: string, username: string): Promise<Profile> {
    const existing = await manager.findOneBy(Profile, { ownerId });
    if (existing) return existing;
    try {
      return await manager.save(Profile, manager.create(Profile, profileDefaults(ownerId, username)));
    } catch (error) {
      // Two concurrent first-reads (e.g. the public portfolio aggregate
      // reading Profile and Translations at once) can both race past the
      // `existing` check above; the loser re-fetches the row the winner just
      // created instead of surfacing a spurious 500.
      if (error instanceof QueryFailedError && /unique/i.test(error.message)) {
        return manager.findOneByOrFail(Profile, { ownerId });
      }
      throw error;
    }
  }
}

function toProfile(user: AdminUser, profile: Profile): ProfileContract {
  return {
    id: profile.id,
    username: user.username,
    email: user.email,
    name: profile.name,
    ...(profile.fullName ? { fullName: profile.fullName } : {}),
    headline: profile.headline ?? {},
    bio: profile.bio ?? {},
    ...(profile.avatar ? { avatar: profile.avatar } : {}),
    resume: profile.resume ?? {},
    stats: profile.stats ?? [],
    activeLocales: profile.activeLocales,
    defaultLocale: profile.defaultLocale,
  };
}
