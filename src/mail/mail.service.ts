import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailService } from './mail.service.interface';

@Injectable()
export class MailService implements IMailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT'),
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM'),
      to,
      subject: 'Your verification code',
      html: `<p>Your OTP code: <strong>${otp}</strong></p>`,
    });
  }
}