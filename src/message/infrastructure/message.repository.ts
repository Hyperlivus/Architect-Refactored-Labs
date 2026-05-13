import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { Message } from './message.entity';
import { MessageDomain } from '../domain/message.domain';
import { ScheduledMessageDomain } from '../domain/scheduled-message.domain';
import type { IMessageRepository } from '../domain/message.repository.interface';

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly orm: Repository<Message>,
  ) {}

  private toDomain(entity: Message): MessageDomain {
    if (entity.scheduledAt) {
      return new ScheduledMessageDomain(
        entity.id,
        entity.content,
        entity.chatId,
        entity.memberId,
        entity.createdAt,
        entity.deletedAt,
        entity.scheduledAt,
        entity.sentAt,
      );
    }
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

  async findPendingScheduled(now: Date): Promise<ScheduledMessageDomain[]> {
    const entities = await this.orm.find({
      where: {
        scheduledAt: LessThanOrEqual(now),
        sentAt: IsNull(),
        deletedAt: IsNull(),
      },
    });
    return entities
      .filter((e) => e.scheduledAt !== null)
      .map(
        (e) =>
          new ScheduledMessageDomain(
            e.id,
            e.content,
            e.chatId,
            e.memberId,
            e.createdAt,
            e.deletedAt,
            e.scheduledAt!,
            e.sentAt,
          ),
      );
  }

  async save(domain: MessageDomain): Promise<MessageDomain> {
    const entity = this.orm.create({
      id: domain.id,
      content: domain.content,
      chatId: domain.chatId,
      memberId: domain.memberId,
      createdAt: domain.createdAt,
      deletedAt: domain.deletedAt,
      scheduledAt: domain.scheduledAt,
      sentAt: domain.sentAt,
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
