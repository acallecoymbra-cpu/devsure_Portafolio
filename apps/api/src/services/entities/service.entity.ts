import type { TranslatableString } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'services' })
@Index('IDX_services_owner', ['ownerId', 'sortOrder', 'id'])
export class Service {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'simple-json' }) title!: TranslatableString;
  @Column({ type: 'simple-json' }) description!: TranslatableString;
  @Column({ type: 'varchar', length: 60, nullable: true }) icon!: string | null;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
