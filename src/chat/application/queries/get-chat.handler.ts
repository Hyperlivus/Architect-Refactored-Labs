import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CHAT_REPOSITORY } from '../../domain/chat.repository.interface';
import type { IChatRepository } from '../../domain/chat.repository.interface';
import { ChatNotFoundError } from '../../domain/chat.errors';
import type { ChatReadModel } from '../read-models/chat.read-model';
import { toChatReadModel } from '../read-models/chat.read-model';
import { GetChatQuery } from './get-chat.query';

@QueryHandler(GetChatQuery)
export class GetChatHandler implements IQueryHandler<
  GetChatQuery,
  ChatReadModel
> {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chatRepository: IChatRepository,
  ) {}

  async execute(query: GetChatQuery): Promise<ChatReadModel> {
    const chat = await this.chatRepository.findById(query.chatId);
    if (!chat) throw new ChatNotFoundError();
    return toChatReadModel(chat);
  }
}
