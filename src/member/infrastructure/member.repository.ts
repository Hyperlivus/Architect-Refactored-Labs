import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './member.entity';
import { MemberMapper } from './member.mapper';
import type { MemberDomain } from '../domain/member.domain';
import type { IMemberRepository } from '../domain/member.repository.interface';

@Injectable()
export class MemberRepository implements IMemberRepository {
  constructor(
    @InjectRepository(Member)
    private readonly orm: Repository<Member>,
  ) {}

  async findById(id: number): Promise<MemberDomain | null> {
    const entity = await this.orm.findOne({ where: { id } });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async findByChatAndUser(
    chatId: number,
    userId: number,
  ): Promise<MemberDomain | null> {
    const entity = await this.orm.findOne({ where: { chatId, userId } });
    return entity ? MemberMapper.toDomain(entity) : null;
  }

  async create(domain: MemberDomain): Promise<MemberDomain> {
    const { id: _id, ...data } = MemberMapper.toEntity(domain);
    const saved = await this.orm.save(this.orm.create(data));
    return MemberMapper.toDomain(saved);
  }

  async save(domain: MemberDomain): Promise<MemberDomain> {
    const saved = await this.orm.save(
      this.orm.create(MemberMapper.toEntity(domain)),
    );
    return MemberMapper.toDomain(saved);
  }
}
