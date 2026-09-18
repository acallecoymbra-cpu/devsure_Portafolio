import type { TranslatableString } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'culture_stories' })
@Index('IDX_culture_stories_owner', ['ownerId', 'sortOrder', 'id'])
export class CultureStory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'simple-json' }) kicker!: TranslatableString;
  @Column({ type: 'simple-json' }) title!: TranslatableString;
  @Column({ type: 'simple-json' }) description!: TranslatableString;
  @Column({ name: 'image_src', type: 'varchar', length: 500 }) imageSrc!: string;
  @Column({ name: 'image_alt', type: 'varchar', length: 300 }) imageAlt!: string;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
