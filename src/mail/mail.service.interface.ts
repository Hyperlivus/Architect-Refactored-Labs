export const MAIL_SERVICE = Symbol('MAIL_SERVICE');
export const MAIL_OPTIONS = Symbol('MAIL_OPTIONS');

export interface MailModuleOptions {
  from: string;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface IMailService {
  send(options: SendMailOptions): Promise<void>;
}
