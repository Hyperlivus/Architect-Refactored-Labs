import { DomainError } from '../shared/domain.error';

export class MessageNotFoundError extends DomainError {
  readonly statusCode = 404;
  constructor() {
    super('Message not found');
  }
}
