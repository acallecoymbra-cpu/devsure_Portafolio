import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const TECHNOLOGY_PUBLICATION_STATUSES = ['draft', 'published'] as const;

export type TechnologyPublicationStatus = (typeof TECHNOLOGY_PUBLICATION_STATUSES)[number];

@Entity({ name: 'technologies' })
@Index('UQ_technologies_slug', ['slug'], { unique: true })
@Index('IDX_technologies_public_order', ['publicationStatus', 'sortOrder', 'name', 'id'])
@Index('IDX_technologies_public_featured', ['publicationStatus', 'featured'])
@Index('IDX_technologies_public_category', ['publicationStatus', 'category'])
@Check('CHK_technologies_slug_lowercase', '"slug" = LOWER("slug")')
@Check('CHK_technologies_publication_status', "\"publication_status\" IN ('draft', 'published')")
@Check('CHK_technologies_sort_order', '"sort_order" >= 0')
@Check(
  'CHK_technologies_published_at',
  '"publication_status" <> \'published\' OR "published_at" IS NOT NULL',
)
export class Technology {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 64 })
  slug!: string;

  @Column({ type: 'varchar', length: 64 })
  category!: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  summary!: string | null;

  @Column({ name: 'icon_key', type: 'varchar', length: 64 })
  iconKey!: string;

  @Column({ type: 'boolean', default: false })
  featured!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ name: 'publication_status', type: 'varchar', length: 16, default: 'draft' })
  publicationStatus!: TechnologyPublicationStatus;

  @Column({ name: 'published_at', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
