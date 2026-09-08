import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from '../../auth/entities/admin-user.entity';
import type { ProfileStat, TranslatableString } from '@devsure/contracts';

@Entity({ name: 'profiles' })
@Index('UQ_profiles_owner', ['ownerId'], { unique: true })
export class Profile {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;
  @OneToOne(() => AdminUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner!: AdminUser;

  @Column({ type: 'varchar', length: 150 }) name!: string;
  @Column({ name: 'full_name', type: 'varchar', length: 150, nullable: true }) fullName!: string | null;

  @Column({ type: 'simple-json', nullable: true }) headline!: TranslatableString | null;
  @Column({ type: 'simple-json', nullable: true }) bio!: TranslatableString | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) avatar!: string | null;
  @Column({ type: 'simple-json', nullable: true }) resume!: TranslatableString | null;
  @Column({ type: 'simple-json', nullable: true }) stats!: ProfileStat[] | null;

  @Column({ name: 'active_locales', type: 'simple-array', default: 'en' })
  activeLocales!: string[];
  @Column({ name: 'default_locale', type: 'varchar', length: 8, default: 'en' })
  defaultLocale!: string;

  // Editorial section headings/intros (spec §5.2, §6.2). Not translated per
  // locale like `headline`/`bio`: `heroTag` is a single short plain string.
  @Column({ name: 'hero_tag', type: 'varchar', length: 60, nullable: true }) heroTag!: string | null;
  @Column({ name: 'hero_title', type: 'simple-json', nullable: true }) heroTitle!: TranslatableString | null;
  @Column({ name: 'hero_copy', type: 'simple-json', nullable: true }) heroCopy!: TranslatableString | null;
  @Column({ name: 'hero_note', type: 'simple-json', nullable: true }) heroNote!: TranslatableString | null;
  @Column({ name: 'about_heading', type: 'simple-json', nullable: true }) aboutHeading!: TranslatableString | null;
  @Column({ name: 'about_body', type: 'simple-json', nullable: true }) aboutBody!: TranslatableString | null;
  @Column({ name: 'strengths_heading', type: 'simple-json', nullable: true }) strengthsHeading!: TranslatableString | null;
  @Column({ name: 'strengths_intro', type: 'simple-json', nullable: true }) strengthsIntro!: TranslatableString | null;
  @Column({ name: 'experience_heading', type: 'simple-json', nullable: true }) experienceHeading!: TranslatableString | null;
  @Column({ name: 'experience_intro', type: 'simple-json', nullable: true }) experienceIntro!: TranslatableString | null;
  @Column({ name: 'education_heading', type: 'simple-json', nullable: true }) educationHeading!: TranslatableString | null;
  @Column({ name: 'portfolio_heading', type: 'simple-json', nullable: true }) portfolioHeading!: TranslatableString | null;
  @Column({ name: 'portfolio_intro', type: 'simple-json', nullable: true }) portfolioIntro!: TranslatableString | null;
  @Column({ name: 'skills_heading', type: 'simple-json', nullable: true }) skillsHeading!: TranslatableString | null;
  @Column({ name: 'skills_intro', type: 'simple-json', nullable: true }) skillsIntro!: TranslatableString | null;
  @Column({ name: 'workstyle_heading', type: 'simple-json', nullable: true }) workstyleHeading!: TranslatableString | null;
  @Column({ name: 'workstyle_intro', type: 'simple-json', nullable: true }) workstyleIntro!: TranslatableString | null;
  @Column({ name: 'testimonials_heading', type: 'simple-json', nullable: true }) testimonialsHeading!: TranslatableString | null;
  @Column({ name: 'faq_heading', type: 'simple-json', nullable: true }) faqHeading!: TranslatableString | null;
  @Column({ name: 'blog_heading', type: 'simple-json', nullable: true }) blogHeading!: TranslatableString | null;
  @Column({ name: 'contact_heading', type: 'simple-json', nullable: true }) contactHeading!: TranslatableString | null;
  @Column({ name: 'contact_intro', type: 'simple-json', nullable: true }) contactIntro!: TranslatableString | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
