import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Message } from './message.entity';
import { MessageDomain } from '../domain/message.domain';
import type { IMessageRepository } from '../domain/message.repository.interface';

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly orm: Repository<Message>,
  ) {}

  private toDomain(entity: Message): MessageDomain {
    return new MessageDomain(
      entity.id,
      entity.content,
      entity.chatId,
      entity.memberId,
      entity.createdAt,
      entity.deletedAt,
    );
  }

  async findActiveById(
    id: number,
    chatId: number,
  ): Promise<MessageDomain | null> {
    const entity = await this.orm.findOne({ where: { id, chatId } });
    if (!entity || entity.deletedAt) return null;
    return this.toDomain(entity);
  }

  async create(domain: MessageDomain): Promise<MessageDomain> {
    const entity = this.orm.create({
      content: domain.content,
      chatId: domain.chatId,
      memberId: domain.memberId,
      deletedAt: domain.deletedAt,
    });
    const saved = await this.orm.save(entity);
    return this.toDomain(saved);
  }

  async save(domain: MessageDomain): Promise<MessageDomain> {
    const entity = this.orm.create({
      id: domain.id,
      content: domain.content,
      chatId: domain.chatId,
      memberId: domain.memberId,
      createdAt: domain.createdAt,
      deletedAt: domain.deletedAt,
    });
    const saved = await this.orm.save(entity);
    return this.toDomain(saved);
  }

  async list(
    chatId: number,
    skip: number,
    take: number,
  ): Promise<{ items: MessageDomain[]; total: number }> {
    const [entities, total] = await this.orm.findAndCount({
      where: { chatId, deletedAt: IsNull() },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
    return { items: entities.map((e) => this.toDomain(e)), total };
  }
}
