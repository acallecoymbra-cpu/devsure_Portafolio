import type { Translations as TranslationsContract } from '@devsure/contracts';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AdminUser } from '../auth/entities/admin-user.entity';
import { Profile } from './entities/profile.entity';
import { UpdateTranslationsDto } from './dto/translations.dto';
import { profileDefaults } from './profile.defaults';

@Injectable()
export class TranslationsService {
  constructor(
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    @InjectRepository(AdminUser) private readonly users: Repository<AdminUser>,
  ) {}

  async get(ownerId: string): Promise<TranslationsContract> {
    return toTranslations(await this.getOrCreate(ownerId));
  }

  async update(ownerId: string, input: UpdateTranslationsDto): Promise<TranslationsContract> {
    const profile = await this.getOrCreate(ownerId);
    this.profiles.merge(profile, input);
    return toTranslations(await this.profiles.save(profile));
  }

  private async getOrCreate(ownerId: string): Promise<Profile> {
    const existing = await this.profiles.findOneBy({ ownerId });
    if (existing) return existing;
    const user = await this.users.findOneByOrFail({ id: ownerId });
    try {
      return await this.profiles.save(this.profiles.create(profileDefaults(ownerId, user.username)));
    } catch (error) {
      // See ProfileService.getOrCreate: the public portfolio aggregate reads
      // Profile and Translations concurrently, so both can race to create
      // the first-ever row for an owner.
      if (error instanceof QueryFailedError && /unique/i.test(error.message)) {
        return this.profiles.findOneByOrFail({ ownerId });
      }
      throw error;
    }
  }
}

function toTranslations(profile: Profile): TranslationsContract {
  return {
    ...(profile.heroTag ? { heroTag: profile.heroTag } : {}),
    heroTitle: profile.heroTitle ?? {},
    heroCopy: profile.heroCopy ?? {},
    heroNote: profile.heroNote ?? {},
    aboutHeading: profile.aboutHeading ?? {},
    aboutBody: profile.aboutBody ?? {},
    strengthsHeading: profile.strengthsHeading ?? {},
    strengthsIntro: profile.strengthsIntro ?? {},
    experienceHeading: profile.experienceHeading ?? {},
    experienceIntro: profile.experienceIntro ?? {},
    educationHeading: profile.educationHeading ?? {},
    portfolioHeading: profile.portfolioHeading ?? {},
    portfolioIntro: profile.portfolioIntro ?? {},
    skillsHeading: profile.skillsHeading ?? {},
    skillsIntro: profile.skillsIntro ?? {},
    workstyleHeading: profile.workstyleHeading ?? {},
    workstyleIntro: profile.workstyleIntro ?? {},
    testimonialsHeading: profile.testimonialsHeading ?? {},
    faqHeading: profile.faqHeading ?? {},
    blogHeading: profile.blogHeading ?? {},
    contactHeading: profile.contactHeading ?? {},
    contactIntro: profile.contactIntro ?? {},
  };
}
