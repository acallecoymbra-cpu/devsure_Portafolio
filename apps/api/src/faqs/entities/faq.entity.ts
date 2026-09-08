import type { TranslatableString } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'faqs' })
@Index('IDX_faqs_owner', ['ownerId', 'sortOrder', 'id'])
export class Faq {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'simple-json' }) question!: TranslatableString;
  @Column({ type: 'simple-json' }) answer!: TranslatableString;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
