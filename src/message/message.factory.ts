import { DomainError } from '../shared/domain.error';

export class InvalidMessageDataError extends DomainError {
  readonly statusCode = 422;
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
  }) {
    if (!params.content.trim()) {
      throw new InvalidMessageDataError('Message content cannot be empty');
    }
    if (params.content.length > this.MAX_LENGTH) {
      throw new InvalidMessageDataError(
        `Message content cannot exceed ${this.MAX_LENGTH} characters`,
      );
    }

    return {
      content: params.content,
      chatId: params.chatId,
      memberId: params.memberId,
      deletedAt: null,
    };
  }
}
