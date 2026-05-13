import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column()
  chatId: number;

  @Column()
  memberId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date | null;

  @Column({ nullable: true, type: 'timestamp', name: 'scheduled_at' })
  scheduledAt: Date | null;

  @Column({ nullable: true, type: 'timestamp', name: 'sent_at' })
  sentAt: Date | null;
}
