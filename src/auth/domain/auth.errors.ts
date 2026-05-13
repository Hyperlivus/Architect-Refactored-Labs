import { DomainError } from '../../shared/domain.error';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials');
  }
}

export class EmailNotVerifiedError extends DomainError {
  constructor() {
    super('Email is not verified');
  }
}

export class InvalidOtpError extends DomainError {
  constructor() {
    super('Invalid or expired OTP code');
  }
}
