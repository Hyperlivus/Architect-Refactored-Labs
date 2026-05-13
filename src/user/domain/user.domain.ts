import { InvalidUserDataError } from './user.errors';

export class UserDomain {
  constructor(
    public readonly id: number | undefined,
    public email: string,
    public nickname: string,
    public readonly tag: string,
    public passwordHash: string,
    public emailVerified: boolean,
    public otp: string | null,
  ) {}

  verifyEmail(): void {
    this.emailVerified = true;
    this.otp = null;
  }

  setOtp(otp: string): void {
    this.otp = otp;
  }

  clearOtp(): void {
    this.otp = null;
  }

  updatePassword(passwordHash: string): void {
    this.passwordHash = passwordHash;
  }

  updateNickname(nickname: string): void {
    if (nickname.length < 2 || nickname.length > 50) {
      throw new InvalidUserDataError(
        'Nickname must be between 2 and 50 characters',
      );
    }
    this.nickname = nickname;
  }
}
