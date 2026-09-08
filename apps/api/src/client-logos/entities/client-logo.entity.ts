import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'client_logos' })
@Index('IDX_client_logos_owner', ['ownerId', 'sortOrder', 'id'])
export class ClientLogo {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'varchar', length: 150 }) name!: string;
  @Column({ type: 'varchar', length: 255 }) logo!: string;
  @Column({ name: 'website_url', type: 'varchar', length: 500, nullable: true }) websiteUrl!: string | null;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
