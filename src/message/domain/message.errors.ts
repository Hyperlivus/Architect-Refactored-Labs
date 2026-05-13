import { DomainError } from '../../shared/domain.error';

export class MessageNotFoundError extends DomainError {
  constructor() {
    super('Message not found');
  }
}
