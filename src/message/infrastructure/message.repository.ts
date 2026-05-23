import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Message } from './message.entity';
import { MessageMapper } from './message.mapper';
import type { MessageDomain } from '../domain/message.domain';
import type { IMessageRepository } from '../domain/message.repository.interface';

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly orm: Repository<Message>,
  ) {}

  async findActiveById(
    id: number,
    chatId: number,
  ): Promise<MessageDomain | null> {
    const entity = await this.orm.findOne({ where: { id, chatId } });
    if (!entity || entity.deletedAt) return null;
    return MessageMapper.toDomain(entity);
  }

  async create(domain: MessageDomain): Promise<MessageDomain> {
    const {
      id: _id,
      createdAt: _createdAt,
      ...data
    } = MessageMapper.toEntity(domain);
    const saved = await this.orm.save(this.orm.create(data));
    return MessageMapper.toDomain(saved);
  }

  async save(domain: MessageDomain): Promise<MessageDomain> {
    const saved = await this.orm.save(
      this.orm.create(MessageMapper.toEntity(domain)),
    );
    return MessageMapper.toDomain(saved);
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
    return { items: entities.map(MessageMapper.toDomain), total };
  }
}
