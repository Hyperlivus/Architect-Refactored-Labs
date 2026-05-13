import { DomainError } from '../../shared/domain.error';

export class InvalidUserDataError extends DomainError {
  constructor(reason: string) {
    super(reason);
  }
}

export class UserNotFoundError extends DomainError {
  constructor() {
    super('User not found');
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(field: string) {
    super(`User with this ${field} already exists`);
  }
}
