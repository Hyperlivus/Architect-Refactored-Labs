import { DomainError } from '../shared/domain.error';

export class MemberNotFoundError extends DomainError {
  readonly statusCode = 404;
  constructor() {
    super('Member not found');
  }
}

export class MemberBannedError extends DomainError {
  readonly statusCode = 403;
  constructor() {
    super('You are banned from this chat');
  }
}

export class AlreadyMemberError extends DomainError {
  readonly statusCode = 409;
  constructor() {
    super('User is already a member of this chat');
  }
}

export class InsufficientPermissionsError extends DomainError {
  readonly statusCode = 403;
  constructor(reason = 'Insufficient permissions') {
    super(reason);
  }
}
