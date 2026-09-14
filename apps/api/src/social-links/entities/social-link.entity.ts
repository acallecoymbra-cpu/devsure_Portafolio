import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'social_links' })
@Index('IDX_social_links_owner', ['ownerId', 'sortOrder', 'id'])
export class SocialLink {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'varchar', length: 100 }) name!: string;
  @Column({ type: 'varchar', length: 500 }) url!: string;
  @Column({ name: 'icon_key', type: 'varchar', length: 32 }) iconKey!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) icon!: string | null;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
