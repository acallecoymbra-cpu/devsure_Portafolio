import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AdminUser } from './admin-user.entity';

@Entity({ name: 'admin_sessions' })
@Index('IDX_admin_sessions_user', ['userId'])
@Index('IDX_admin_sessions_expires', ['expiresAt'])
export class AdminSession {
  @PrimaryColumn({ type: 'varchar', length: 36 }) selector!: string;
  @Column({ name: 'user_id', type: 'varchar', length: 36 }) userId!: string;
  @Column({ name: 'token_hash', type: 'varchar', length: 64 }) tokenHash!: string;
  @Column({ name: 'csrf_hash', type: 'varchar', length: 64 }) csrfHash!: string;
  @Column({ name: 'expires_at', type: 'datetime' }) expiresAt!: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @ManyToOne(() => AdminUser, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) user!: AdminUser;
}
