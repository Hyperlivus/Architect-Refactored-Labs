import { DomainError } from '../shared/domain.error';

export class ChatNotFoundError extends DomainError {
  readonly statusCode = 404;
  constructor() {
    super('Chat not found');
  }
}

export class ChatTagTakenError extends DomainError {
  readonly statusCode = 409;
  constructor() {
    super('Chat with this tag already exists');
  }
}
