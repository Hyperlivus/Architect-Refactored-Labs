import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  findByEmailOrTag(emailOrTag: string): Promise<User | null> {
    const isEmail = emailOrTag.includes('@');
    return isEmail
      ? this.repo.findOne({ where: { email: emailOrTag } })
      : this.repo.findOne({ where: { tag: emailOrTag } });
  }

  create(data: Pick<User, 'email' | 'nickname' | 'tag' | 'passwordHash'>): Promise<User> {
    const user = this.repo.create({ ...data, emailVerified: false, otp: null });
    return this.repo.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<void> {
    await this.repo.update(id, data);
  }
}
