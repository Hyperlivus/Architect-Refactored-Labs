import { DomainError } from '../../shared/domain.error';

export class MemberNotFoundError extends DomainError {
  constructor() {
    super('Member not found');
  }
}

export class MemberBannedError extends DomainError {
  constructor() {
    super('You are banned from this chat');
  }
}

export class AlreadyMemberError extends DomainError {
  constructor() {
    super('User is already a member of this chat');
  }
}

export class InsufficientPermissionsError extends DomainError {
  constructor(message = 'Insufficient permissions') {
    super(message);
  }
}
