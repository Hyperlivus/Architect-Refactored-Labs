import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from './user.entity';
import { UserFactory } from './user.factory';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findOne(where: FindOptionsWhere<User>): Promise<User | null> {
    return this.repo.findOne({ where });
  }

  findByEmailOrTag(emailOrTag: string): Promise<User | null> {
    const isEmail = emailOrTag.includes('@');
    return this.findOne(isEmail ? { email: emailOrTag } : { tag: emailOrTag });
  }

  create(data: Pick<User, 'email' | 'nickname' | 'tag' | 'passwordHash'>): Promise<User> {
    const validated = UserFactory.create(data);
    return this.repo.save(this.repo.create(validated));
  }

  async update(id: number, data: Partial<User>): Promise<void> {
    await this.repo.update(id, data);
  }
}
