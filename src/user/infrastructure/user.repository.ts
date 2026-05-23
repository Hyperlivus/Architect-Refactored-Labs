import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserDomain } from '../domain/user.domain';
import type { IUserRepository } from '../domain/user.repository.interface';
import { UserMapper } from './user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly orm: Repository<User>,
  ) {}

  async findById(id: number): Promise<UserDomain | null> {
    const entity = await this.orm.findOne({ where: { id } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<UserDomain | null> {
    const entity = await this.orm.findOne({ where: { email } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByTag(tag: string): Promise<UserDomain | null> {
    const entity = await this.orm.findOne({ where: { tag } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async create(domain: UserDomain): Promise<UserDomain> {
    const { id: _id, ...data } = UserMapper.toEntity(domain);
    const entity = this.orm.create(data);
    const saved = await this.orm.save(entity);
    return UserMapper.toDomain(saved);
  }

  async save(domain: UserDomain): Promise<void> {
    const { id, ...data } = UserMapper.toEntity(domain);
    await this.orm.update(id!, data);
  }
}
