import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MESSAGE_REPOSITORY } from '../../domain/message.repository.interface';
import type { IMessageRepository } from '../../domain/message.repository.interface';
import { ScheduledMessageDeliveredEvent } from '../events/scheduled-message-delivered.event';

@Injectable()
export class MessageSchedulerService {
  private readonly logger = new Logger(MessageSchedulerService.name);

  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    private readonly eventBus: EventBus,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledMessages(): Promise<void> {
    const pending = await this.messageRepository.findPendingScheduled(
      new Date(),
    );

    if (pending.length === 0) return;

    this.logger.log(`Processing ${pending.length} scheduled message(s)`);

    for (const message of pending) {
      message.deliver();
      await this.messageRepository.save(message);

      this.eventBus.publish(
        new ScheduledMessageDeliveredEvent(
          message.id!,
          message.chatId,
          message.memberId,
          message.content,
          message.sentAt!,
        ),
      );
    }
  }
}
