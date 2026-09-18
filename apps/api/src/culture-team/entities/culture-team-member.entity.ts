import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'culture_team_members' })
@Index('IDX_culture_team_members_owner', ['ownerId', 'sortOrder', 'id'])
export class CultureTeamMember {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'varchar', length: 150 }) name!: string;
  @Column({ type: 'varchar', length: 150 }) role!: string;
  @Column({ name: 'neutral_image', type: 'varchar', length: 500 }) neutralImage!: string;
  @Column({ name: 'smiling_image', type: 'varchar', length: 500 }) smilingImage!: string;
  @Column({ type: 'varchar', length: 300, nullable: true }) alt!: string | null;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
