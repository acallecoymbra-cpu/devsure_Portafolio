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
import type { TranslatableString } from '@devsure/contracts';

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

  @Column({ name: 'active_locales', type: 'simple-array', default: 'en' })
  activeLocales!: string[];
  @Column({ name: 'default_locale', type: 'varchar', length: 8, default: 'en' })
  defaultLocale!: string;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
