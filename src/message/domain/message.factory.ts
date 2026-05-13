import { DomainError } from '../../shared/domain.error';
import { MessageDomain } from './message.domain';
import { ScheduledMessageDomain } from './scheduled-message.domain';
import { MessageScheduledInPastError } from './message.errors';

export class InvalidMessageDataError extends DomainError {
  constructor(reason: string) {
    super(reason);
  }
}

export class MessageFactory {
  private static readonly MAX_LENGTH = 4000;

  private static validateContent(content: string): void {
    if (!content.trim()) {
      throw new InvalidMessageDataError('Message content cannot be empty');
    }
    if (content.length > this.MAX_LENGTH) {
      throw new InvalidMessageDataError(
        `Message content cannot exceed ${this.MAX_LENGTH} characters`,
      );
    }
  }

  static create(params: {
    content: string;
    chatId: number;
    memberId: number;
  }): MessageDomain {
    this.validateContent(params.content);

    return new MessageDomain(
      undefined,
      params.content,
      params.chatId,
      params.memberId,
      undefined,
      null,
    );
  }

  static createScheduled(params: {
    content: string;
    chatId: number;
    memberId: number;
    scheduledAt: Date;
  }): ScheduledMessageDomain {
    this.validateContent(params.content);

    if (params.scheduledAt <= new Date()) {
      throw new MessageScheduledInPastError();
    }

    return new ScheduledMessageDomain(
      undefined,
      params.content,
      params.chatId,
      params.memberId,
      undefined,
      null,
      params.scheduledAt,
      null,
    );
  }
}
