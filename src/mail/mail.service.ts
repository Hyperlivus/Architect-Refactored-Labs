import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type {
  IMailService,
  MailModuleOptions,
  SendMailOptions,
} from './mail.service.interface';
import { MAIL_OPTIONS } from './mail.service.interface';

@Injectable()
export class MailService implements IMailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly config: ConfigService,
    @Inject(MAIL_OPTIONS) private readonly options: MailModuleOptions,
  ) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT'),
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
  }

  async send(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({ from: this.options.from, ...options });
  }
}
