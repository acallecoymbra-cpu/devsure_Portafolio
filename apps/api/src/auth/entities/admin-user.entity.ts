import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AdminSession } from './admin-session.entity';

export const ADMIN_ROLES = ['ADMIN'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

@Entity({ name: 'admin_users' })
@Index('UQ_admin_users_email', ['email'], { unique: true })
@Index('UQ_admin_users_username', ['username'], { unique: true })
export class AdminUser {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 32 }) username!: string;
  @Column({ type: 'varchar', length: 254 }) email!: string;
  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false }) passwordHash!: string;
  @Column({ type: 'varchar', length: 16, default: 'ADMIN' }) role!: AdminRole;
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive!: boolean;
  @Column({ name: 'must_change_password', type: 'boolean', default: true }) mustChangePassword!: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
  @OneToMany(() => AdminSession, (session) => session.user) sessions!: AdminSession[];
}
