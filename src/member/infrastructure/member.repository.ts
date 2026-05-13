import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './member.entity';
import { MemberDomain } from '../domain/member.domain';
import type { IMemberRepository } from '../domain/member.repository.interface';

@Injectable()
export class MemberRepository implements IMemberRepository {
  constructor(
    @InjectRepository(Member)
    private readonly orm: Repository<Member>,
  ) {}

  private toDomain(entity: Member): MemberDomain {
    return new MemberDomain(
      entity.id,
      entity.userId,
      entity.chatId,
      entity.role,
      entity.permissions,
      entity.bannedAt,
      entity.leftAt,
    );
  }

  async findById(id: number): Promise<MemberDomain | null> {
    const entity = await this.orm.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByChatAndUser(
    chatId: number,
    userId: number,
  ): Promise<MemberDomain | null> {
    const entity = await this.orm.findOne({ where: { chatId, userId } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(domain: MemberDomain): Promise<MemberDomain> {
    const entity = this.orm.create({
      chatId: domain.chatId,
      userId: domain.userId,
      role: domain.role,
      permissions: domain.permissions,
      bannedAt: domain.bannedAt,
      leftAt: domain.leftAt,
    });
    const saved = await this.orm.save(entity);
    return this.toDomain(saved);
  }

  async save(domain: MemberDomain): Promise<MemberDomain> {
    const entity = this.orm.create({
      id: domain.id,
      userId: domain.userId,
      chatId: domain.chatId,
      role: domain.role,
      permissions: domain.permissions,
      bannedAt: domain.bannedAt,
      leftAt: domain.leftAt,
    });
    const saved = await this.orm.save(entity);
    return this.toDomain(saved);
  }
}
