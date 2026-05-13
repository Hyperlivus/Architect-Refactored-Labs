import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { ChatDomain } from '../domain/chat.domain';
import type { IChatRepository } from '../domain/chat.repository.interface';

@Injectable()
export class ChatRepository implements IChatRepository {
  constructor(
    @InjectRepository(Chat)
    private readonly orm: Repository<Chat>,
  ) {}

  private toDomain(entity: Chat): ChatDomain {
    return new ChatDomain(
      entity.id,
      entity.name,
      entity.tag,
      entity.description,
    );
  }

  async findById(id: number): Promise<ChatDomain | null> {
    const entity = await this.orm.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTag(tag: string): Promise<ChatDomain | null> {
    const entity = await this.orm.findOne({ where: { tag } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(domain: ChatDomain): Promise<ChatDomain> {
    const entity = this.orm.create({
      name: domain.name,
      tag: domain.tag,
      description: domain.description,
    });
    const saved = await this.orm.save(entity);
    return this.toDomain(saved);
  }

  async save(domain: ChatDomain): Promise<ChatDomain> {
    const entity = this.orm.create({
      id: domain.id,
      name: domain.name,
      tag: domain.tag,
      description: domain.description,
    });
    const saved = await this.orm.save(entity);
    return this.toDomain(saved);
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
    return { items: entities.map((e) => this.toDomain(e)), total };
  }
}
