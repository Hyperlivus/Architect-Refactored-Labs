import { DomainError } from '../shared/domain.error';

export class InvalidUserDataError extends DomainError {
  readonly statusCode = 422;
  constructor(reason: string) {
    super(reason);
  }
}

export class UserFactory {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly TAG_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

  static create(params: {
    email: string;
    nickname: string;
    tag: string;
    passwordHash: string;
  }) {
    if (!this.EMAIL_REGEX.test(params.email)) {
      throw new InvalidUserDataError('Invalid email format');
    }
    if (!this.TAG_REGEX.test(params.tag)) {
      throw new InvalidUserDataError(
        'Tag must be 3-20 alphanumeric characters or underscores',
      );
    }
    if (params.nickname.length < 2 || params.nickname.length > 50) {
      throw new InvalidUserDataError(
        'Nickname must be between 2 and 50 characters',
      );
    }
    if (!params.passwordHash) {
      throw new InvalidUserDataError('Password hash is required');
    }

    return {
      email: params.email.toLowerCase(),
      nickname: params.nickname,
      tag: params.tag,
      passwordHash: params.passwordHash,
      emailVerified: false as const,
      otp: null,
    };
  }
}
