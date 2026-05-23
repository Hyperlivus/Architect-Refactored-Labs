import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IMailService } from '../../../mail/mail.service.interface';
import { MAIL_SERVICE } from '../../../mail/mail.service.interface';
import { UserService } from '../../../user/application/user.service';
import { InvalidCredentialsError } from '../../domain/auth.errors';
import { otpEmail } from '../auth.email-templates';
import { ResendOtpCommand } from './resend-otp.command';

@CommandHandler(ResendOtpCommand)
export class ResendOtpHandler implements ICommandHandler<ResendOtpCommand, void> {
  constructor(
    private readonly userService: UserService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
  ) {}

  async execute(command: ResendOtpCommand): Promise<void> {
    const user = await this.userService.findByEmail(command.email);
    if (!user) throw new InvalidCredentialsError();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.userService.setOtp(user.id!,otp);
    await this.mailService.send(otpEmail(user.email, otp));
  }
}
