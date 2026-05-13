import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MESSAGE_REPOSITORY } from '../../domain/message.repository.interface';
import type { IMessageRepository } from '../../domain/message.repository.interface';
import { MessageFactory } from '../../domain/message.factory';
import { toMessageReadModel } from '../read-models/message.read-model';
import type { MessageReadModel } from '../read-models/message.read-model';
import { SendMessageCommand } from './send-message.command';

@CommandHandler(SendMessageCommand)
export class SendMessageHandler
  implements ICommandHandler<SendMessageCommand, MessageReadModel>
{
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
  ) {}

  async execute(command: SendMessageCommand): Promise<MessageReadModel> {
    const { chatId, content, requestingMemberId } = command;
    const domain = MessageFactory.create({
      content,
      chatId,
      memberId: requestingMemberId,
    });
    const saved = await this.messageRepository.create(domain);
    return toMessageReadModel(saved);
  }
}
