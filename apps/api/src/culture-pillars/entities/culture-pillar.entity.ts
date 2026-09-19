import type { CulturePillarVisual } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'culture_pillars' })
@Index('IDX_culture_pillars_owner', ['ownerId', 'sortOrder', 'id'])
export class CulturePillar {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'varchar', length: 100 }) title!: string;
  @Column({ type: 'varchar', length: 150, default: '' }) keywords!: string;
  @Column({ type: 'varchar', length: 600 }) description!: string;
  @Column({ type: 'varchar', length: 20 }) visual!: CulturePillarVisual;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
