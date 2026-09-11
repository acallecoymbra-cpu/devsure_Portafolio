import type { TestimonialHighlightIcon, TestimonialSource } from '@devsure/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'testimonials' })
@Index('IDX_testimonials_owner', ['ownerId', 'sortOrder', 'id'])
export class Testimonial {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'owner_id', type: 'varchar', length: 36 }) ownerId!: string;

  @Column({ type: 'varchar', length: 150 }) author!: string;
  @Column({ type: 'varchar', length: 150, nullable: true }) role!: string | null;
  @Column({ type: 'varchar', length: 150, nullable: true }) company!: string | null;
  @Column({ type: 'text' }) quote!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) avatar!: string | null;
  @Column({ type: 'float', default: 5 }) rating!: number;
  @Column({ name: 'highlight_text', type: 'varchar', length: 120, nullable: true }) highlightText!: string | null;
  @Column({ name: 'highlight_icon', type: 'varchar', length: 20, nullable: true })
  highlightIcon!: TestimonialHighlightIcon | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) source!: TestimonialSource | null;
  @Column({ name: 'source_url', type: 'varchar', length: 500, nullable: true }) sourceUrl!: string | null;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
