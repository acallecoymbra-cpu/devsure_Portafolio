import type { ProjectApp, TranslatableString } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'projects' })
@Index('UQ_projects_slug', ['slug'], { unique: true })
@Index('IDX_projects_owner', ['ownerId', 'sortOrder', 'id'])
export class Project {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;
  @Column({ name: 'experience_id', type: 'varchar', length: 36, nullable: true }) experienceId!: string | null;

  @Column({ type: 'simple-json' }) title!: TranslatableString;
  @Column({ type: 'varchar', length: 160 }) slug!: string;
  @Column({ type: 'varchar', length: 60, nullable: true }) category!: string | null;
  @Column({ type: 'simple-json', nullable: true }) excerpt!: TranslatableString | null;
  @Column({ type: 'simple-json', nullable: true }) description!: TranslatableString | null;
  @Column({ name: 'cover_image', type: 'varchar', length: 255, nullable: true }) coverImage!: string | null;
  @Column({ type: 'simple-json', nullable: true }) gallery!: string[] | null;
  @Column({ name: 'tech_stack', type: 'simple-json', nullable: true }) techStack!: string[] | null;
  @Column({ type: 'simple-json', nullable: true }) apps!: ProjectApp[] | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) url!: string | null;
  @Column({ name: 'repo_url', type: 'varchar', length: 500, nullable: true }) repoUrl!: string | null;
  @Column({ type: 'boolean', default: false }) featured!: boolean;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;
  @Column({ name: 'published_at', type: 'datetime', nullable: true }) publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
