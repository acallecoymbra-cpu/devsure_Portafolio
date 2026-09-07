import type { ExperienceLevel, TranslatableString } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'experiences' })
@Index('UQ_experiences_slug', ['slug'], { unique: true })
@Index('IDX_experiences_owner', ['ownerId', 'sortOrder', 'company', 'id'])
export class Experience {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'varchar', length: 150 }) company!: string;
  @Column({ type: 'varchar', length: 160 }) slug!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) logo!: string | null;
  @Column({ type: 'simple-json', nullable: true }) summary!: TranslatableString | null;
  @Column({ name: 'tech_stack', type: 'simple-json', nullable: true }) techStack!: string[] | null;
  @Column({ type: 'simple-json' }) levels!: ExperienceLevel[];

  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
