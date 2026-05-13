import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MESSAGE_REPOSITORY } from '../../domain/message.repository.interface';
import type { IMessageRepository } from '../../domain/message.repository.interface';
import { toMessageReadModel } from '../read-models/message.read-model';
import type { MessageReadModel } from '../read-models/message.read-model';
import { ListMessagesQuery } from './list-messages.query';

@QueryHandler(ListMessagesQuery)
export class ListMessagesHandler
  implements
    IQueryHandler<ListMessagesQuery, { items: MessageReadModel[]; total: number }>
{
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
  ) {}

  async execute(
    query: ListMessagesQuery,
  ): Promise<{ items: MessageReadModel[]; total: number }> {
    const { chatId, page, limit } = query;
    const { items, total } = await this.messageRepository.list(
      chatId,
      (page - 1) * limit,
      limit,
    );
    return { items: items.map(toMessageReadModel), total };
  }
}
