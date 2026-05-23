import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { ChatMapper } from './chat.mapper';
import type { ChatDomain } from '../domain/chat.domain';
import type { IChatRepository } from '../domain/chat.repository.interface';

@Injectable()
export class ChatRepository implements IChatRepository {
  constructor(
    @InjectRepository(Chat)
    private readonly orm: Repository<Chat>,
  ) {}

  async findById(id: number): Promise<ChatDomain | null> {
    const entity = await this.orm.findOne({ where: { id } });
    return entity ? ChatMapper.toDomain(entity) : null;
  }

  async findByTag(tag: string): Promise<ChatDomain | null> {
    const entity = await this.orm.findOne({ where: { tag } });
    return entity ? ChatMapper.toDomain(entity) : null;
  }

  async create(domain: ChatDomain): Promise<ChatDomain> {
    const { id: _id, ...data } = ChatMapper.toEntity(domain);
    const saved = await this.orm.save(this.orm.create(data));
    return ChatMapper.toDomain(saved);
  }

  async save(domain: ChatDomain): Promise<ChatDomain> {
    const saved = await this.orm.save(
      this.orm.create(ChatMapper.toEntity(domain)),
    );
    return ChatMapper.toDomain(saved);
  }

  async list(
    skip: number,
    take: number,
  ): Promise<{ items: ChatDomain[]; total: number }> {
    const [entities, total] = await this.orm.findAndCount({
      skip,
      take,
      order: { id: 'DESC' },
    });
    return { items: entities.map(ChatMapper.toDomain), total };
  }
}
