import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Permission, Role } from '../domain/member.enum';

@Entity()
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  chatId: number;

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role: Role;

  @Column({ type: 'text', array: true, default: '{}' })
  permissions: Permission[];

  @Column({ nullable: true, type: 'timestamp' })
  bannedAt: Date | null;

  @Column({ nullable: true, type: 'timestamp' })
  leftAt: Date | null;
}
