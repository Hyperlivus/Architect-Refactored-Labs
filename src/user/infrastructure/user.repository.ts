import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserDomain } from '../domain/user.domain';
import type { IUserRepository } from '../domain/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly orm: Repository<User>,
  ) {}

  private toDomain(entity: User): UserDomain {
    return new UserDomain(
      entity.id,
      entity.email,
      entity.nickname,
      entity.tag,
      entity.passwordHash,
      entity.emailVerified,
      entity.otp,
    );
  }

  async findById(id: number): Promise<UserDomain | null> {
    const entity = await this.orm.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<UserDomain | null> {
    const entity = await this.orm.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTag(tag: string): Promise<UserDomain | null> {
    const entity = await this.orm.findOne({ where: { tag } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(domain: UserDomain): Promise<UserDomain> {
    const entity = this.orm.create({
      email: domain.email,
      nickname: domain.nickname,
      tag: domain.tag,
      passwordHash: domain.passwordHash,
      emailVerified: domain.emailVerified,
      otp: domain.otp,
    });
    const saved = await this.orm.save(entity);
    return this.toDomain(saved);
  }

  async save(domain: UserDomain): Promise<void> {
    await this.orm.update(domain.id!, {
      email: domain.email,
      nickname: domain.nickname,
      passwordHash: domain.passwordHash,
      emailVerified: domain.emailVerified,
      otp: domain.otp,
    });
  }
}
