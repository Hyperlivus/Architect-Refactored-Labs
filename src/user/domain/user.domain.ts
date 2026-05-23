import { InvalidUserDataError } from './user.errors';

export class UserDomain {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly TAG_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

  constructor(
    public readonly id: number | undefined,
    private _email: string,
    private _nickname: string,
    public readonly tag: string,
    private _passwordHash: string,
    private _emailVerified: boolean,
    private _otp: string | null,
  ) {
    if (!UserDomain.EMAIL_REGEX.test(_email)) {
      throw new InvalidUserDataError('Invalid email format');
    }
    if (!UserDomain.TAG_REGEX.test(tag)) {
      throw new InvalidUserDataError(
        'Tag must be 3-20 alphanumeric characters or underscores',
      );
    }
    if (_nickname.length < 2 || _nickname.length > 50) {
      throw new InvalidUserDataError(
        'Nickname must be between 2 and 50 characters',
      );
    }
    if (!_passwordHash) {
      throw new InvalidUserDataError('Password hash is required');
    }
  }

  get email(): string {
    return this._email;
  }
  get nickname(): string {
    return this._nickname;
  }
  get passwordHash(): string {
    return this._passwordHash;
  }
  get emailVerified(): boolean {
    return this._emailVerified;
  }
  get otp(): string | null {
    return this._otp;
  }

  verifyEmail(): void {
    this._emailVerified = true;
    this._otp = null;
  }

  setOtp(otp: string): void {
    if (!/^\d{6}$/.test(otp)) {
      throw new InvalidUserDataError('OTP must be exactly 6 digits');
    }
    this._otp = otp;
  }

  clearOtp(): void {
    this._otp = null;
  }

  updatePassword(passwordHash: string): void {
    if (!passwordHash) {
      throw new InvalidUserDataError('Password hash is required');
    }
    this._passwordHash = passwordHash;
  }

  updateNickname(nickname: string): void {
    if (nickname.length < 2 || nickname.length > 50) {
      throw new InvalidUserDataError(
        'Nickname must be between 2 and 50 characters',
      );
    }
    this._nickname = nickname;
  }
}
