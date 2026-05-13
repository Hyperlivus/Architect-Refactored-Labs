import { DomainError } from '../../shared/domain.error';
import { MessageDomain } from './message.domain';

export class InvalidMessageDataError extends DomainError {
  constructor(reason: string) {
    super(reason);
  }
}

export class MessageFactory {
  private static readonly MAX_LENGTH = 4000;

  static create(params: {
    content: string;
    chatId: number;
    memberId: number;
  }): MessageDomain {
    if (!params.content.trim()) {
      throw new InvalidMessageDataError('Message content cannot be empty');
    }
    if (params.content.length > this.MAX_LENGTH) {
      throw new InvalidMessageDataError(
        `Message content cannot exceed ${this.MAX_LENGTH} characters`,
      );
    }

    return new MessageDomain(
      undefined,
      params.content,
      params.chatId,
      params.memberId,
      undefined,
      null,
    );
  }
}
