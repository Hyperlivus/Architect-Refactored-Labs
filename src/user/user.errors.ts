import { DomainError } from '../shared/domain.error';

export class UserNotFoundError extends DomainError {
  readonly statusCode = 404;
  constructor() {
    super('User not found');
  }
}

export class UserAlreadyExistsError extends DomainError {
  readonly statusCode = 409;
  constructor(field: string) {
    super(`User with this ${field} already exists`);
  }
}
