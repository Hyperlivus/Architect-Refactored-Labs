import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  nickname: string;

  @Column({ unique: true })
  tag: string;

  @Column()
  passwordHash: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true, type: 'varchar' })
  otp: string | null;
}
