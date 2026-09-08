import type { PostCategory, TranslatableString } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'posts' })
@Index('UQ_posts_slug', ['slug'], { unique: true })
@Index('IDX_posts_owner', ['ownerId', 'sortOrder', 'id'])
export class Post {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'simple-json' }) title!: TranslatableString;
  @Column({ type: 'varchar', length: 160 }) slug!: string;
  @Column({ type: 'simple-json', nullable: true }) excerpt!: TranslatableString | null;
  @Column({ type: 'simple-json' }) content!: TranslatableString;
  @Column({ type: 'varchar', length: 30, nullable: true }) category!: PostCategory | null;
  @Column({ name: 'cover_image', type: 'varchar', length: 255, nullable: true }) coverImage!: string | null;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;
  @Column({ name: 'published_at', type: 'datetime', nullable: true }) publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
