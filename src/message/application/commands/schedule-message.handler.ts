import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MESSAGE_REPOSITORY } from '../../domain/message.repository.interface';
import type { IMessageRepository } from '../../domain/message.repository.interface';
import { MessageFactory } from '../../domain/message.factory';
import { toMessageReadModel } from '../read-models/message.read-model';
import type { MessageReadModel } from '../read-models/message.read-model';
import { ScheduleMessageCommand } from './schedule-message.command';

@CommandHandler(ScheduleMessageCommand)
export class ScheduleMessageHandler implements ICommandHandler<
  ScheduleMessageCommand,
  MessageReadModel
> {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
  ) {}

  async execute(command: ScheduleMessageCommand): Promise<MessageReadModel> {
    const { chatId, content, requestingMemberId, scheduledAt } = command;

    const domain = MessageFactory.createScheduled({
      content,
      chatId,
      memberId: requestingMemberId,
      scheduledAt,
    });

    const saved = await this.messageRepository.create(domain);
    return toMessageReadModel(saved);
  }
}
