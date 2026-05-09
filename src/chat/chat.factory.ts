import { DomainError } from '../shared/domain.error';

export class InvalidChatDataError extends DomainError {
  readonly statusCode = 422;
  constructor(reason: string) {
    super(reason);
  }
}

export class ChatFactory {
  private static readonly TAG_REGEX = /^[a-zA-Z0-9_]{3,32}$/;

  static create(params: {
    name: string;
    tag: string;
    description?: string | null;
  }) {
    if (params.name.length < 2 || params.name.length > 100) {
      throw new InvalidChatDataError('Chat name must be between 2 and 100 characters');
    }
    if (!this.TAG_REGEX.test(params.tag)) {
      throw new InvalidChatDataError('Tag must be 3-32 alphanumeric characters or underscores');
    }
    if (params.description && params.description.length > 500) {
      throw new InvalidChatDataError('Description must not exceed 500 characters');
    }

    return {
      name: params.name,
      tag: params.tag,
      description: params.description ?? null,
    };
  }
}
