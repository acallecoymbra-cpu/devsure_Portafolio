import type { TranslatableString } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'strengths' })
@Index('IDX_strengths_owner', ['ownerId', 'sortOrder', 'id'])
export class Strength {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'simple-json' }) label!: TranslatableString;
  @Column({ type: 'simple-json' }) title!: TranslatableString;
  @Column({ type: 'simple-json' }) body!: TranslatableString;
  @Column({ name: 'tech_stack', type: 'simple-json', nullable: true }) techStack!: string[] | null;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
