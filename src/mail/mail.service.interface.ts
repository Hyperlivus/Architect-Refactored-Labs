export const MAIL_SERVICE = Symbol('MAIL_SERVICE');

export interface IMailService {
  sendOtp(to: string, otp: string): Promise<void>;
}