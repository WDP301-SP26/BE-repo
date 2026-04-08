import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewMilestoneCode, ReviewSessionStatus } from '../common/enums';
import { Class } from './class.entity';
import { Group } from './group.entity';
import { Semester } from './semester.entity';
import { User } from './user.entity';

export interface ReviewSessionParticipantReport {
  user_id: string;
  user_name: string | null;
  present: boolean;
  did_contribute: boolean;
  contribution_summary: string | null;
  completed_items: string[];
  pending_items: string[];
  note: string | null;
}

@Entity('ReviewSession')
@Index('IDX_review_session_semester', ['semester_id'])
@Index('IDX_review_session_class', ['class_id'])
@Index('IDX_review_session_group', ['group_id'])
@Index('IDX_review_session_milestone', ['milestone_code'])
@Index('IDX_review_session_review_date', ['review_date'])
export class ReviewSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  semester_id: string;

  @Column({ type: 'uuid' })
  class_id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @Column({ type: 'enum', enum: ReviewMilestoneCode })
  milestone_code: ReviewMilestoneCode;

  @Column({ type: 'timestamptz' })
  review_date: Date;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({
    type: 'enum',
    enum: ReviewSessionStatus,
    default: ReviewSessionStatus.COMPLETED,
  })
  status: ReviewSessionStatus;

  @Column({ type: 'text', nullable: true })
  lecturer_note: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  participant_reports: ReviewSessionParticipantReport[];

  @Column({ type: 'uuid', nullable: true })
  created_by_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Semester, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;

  @ManyToOne(() => Class, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  created_by: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_id' })
  updated_by: User | null;
}
