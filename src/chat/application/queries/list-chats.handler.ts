import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CHAT_REPOSITORY } from '../../domain/chat.repository.interface';
import type { IChatRepository } from '../../domain/chat.repository.interface';
import type { ChatReadModel } from '../read-models/chat.read-model';
import { toChatReadModel } from '../read-models/chat.read-model';
import { ListChatsQuery } from './list-chats.query';

@QueryHandler(ListChatsQuery)
export class ListChatsHandler implements IQueryHandler<
  ListChatsQuery,
  { items: ChatReadModel[]; total: number }
> {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chatRepository: IChatRepository,
  ) {}

  async execute(
    query: ListChatsQuery,
  ): Promise<{ items: ChatReadModel[]; total: number }> {
    const { page, limit } = query;
    const { items, total } = await this.chatRepository.list(
      (page - 1) * limit,
      limit,
    );
    return { items: items.map(toChatReadModel), total };
  }
}
