import type { TranslatableString } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'studies' })
@Index('IDX_studies_owner', ['ownerId', 'sortOrder', 'id'])
export class Study {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'varchar', length: 150 }) institution!: string;
  @Column({ type: 'simple-json' }) title!: TranslatableString;
  @Column({ type: 'varchar', length: 100, nullable: true }) field!: string | null;
  @Column({ type: 'simple-json', nullable: true }) description!: TranslatableString | null;
  @Column({ name: 'start_date', type: 'date', nullable: true }) startDate!: string | null;
  @Column({ name: 'end_date', type: 'date', nullable: true }) endDate!: string | null;
  @Column({ name: 'in_progress', type: 'boolean', default: false }) inProgress!: boolean;
  @Column({ type: 'varchar', length: 255, nullable: true }) logo!: string | null;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
