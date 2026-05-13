import { DomainError } from '../../shared/domain.error';

export class MessageNotFoundError extends DomainError {
  constructor() {
    super('Message not found');
  }
}

export class MessageScheduledInPastError extends DomainError {
  constructor() {
    super('Scheduled time must be in the future');
  }
}
