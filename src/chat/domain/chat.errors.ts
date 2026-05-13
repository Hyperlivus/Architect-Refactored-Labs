import { DomainError } from '../../shared/domain.error';

export class InvalidChatDataError extends DomainError {
  constructor(reason: string) {
    super(reason);
  }
}

export class ChatNotFoundError extends DomainError {
  constructor() {
    super('Chat not found');
  }
}

export class ChatTagTakenError extends DomainError {
  constructor() {
    super('Chat with this tag already exists');
  }
}
