import { DomainError } from '../shared/domain.error';

export class InvalidCredentialsError extends DomainError {
  readonly statusCode = 401;
  constructor() {
    super('Invalid credentials');
  }
}

export class EmailNotVerifiedError extends DomainError {
  readonly statusCode = 403;
  constructor() {
    super('Email is not verified');
  }
}

export class InvalidOtpError extends DomainError {
  readonly statusCode = 400;
  constructor() {
    super('Invalid or expired OTP code');
  }
}
