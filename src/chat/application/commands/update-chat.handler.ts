import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CHAT_REPOSITORY } from '../../domain/chat.repository.interface';
import type { IChatRepository } from '../../domain/chat.repository.interface';
import { ChatNotFoundError } from '../../domain/chat.errors';
import type { ChatReadModel } from '../read-models/chat.read-model';
import { toChatReadModel } from '../read-models/chat.read-model';
import { UpdateChatCommand } from './update-chat.command';

@CommandHandler(UpdateChatCommand)
export class UpdateChatHandler
  implements ICommandHandler<UpdateChatCommand, ChatReadModel>
{
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chatRepository: IChatRepository,
  ) {}

  async execute(command: UpdateChatCommand): Promise<ChatReadModel> {
    const { chatId, name, description } = command;

    const chat = await this.chatRepository.findById(chatId);
    if (!chat) throw new ChatNotFoundError();

    chat.updateInfo({
      name,
      description: description !== undefined ? (description ?? null) : undefined,
    });
    const saved = await this.chatRepository.save(chat);
    return toChatReadModel(saved);
  }
}
