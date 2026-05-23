import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../../user/application/user.service';
import type { IMailService } from '../../../mail/mail.service.interface';
import { MAIL_SERVICE } from '../../../mail/mail.service.interface';
import { UserAlreadyExistsError } from '../../../user/domain/user.errors';
import { otpEmail } from '../auth.email-templates';
import { RegisterCommand } from './register.command';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand, void> {
  constructor(
    private readonly userService: UserService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
  ) {}

  async execute(command: RegisterCommand): Promise<void> {
    const { email, nickname, tag, password } = command;

    const [byEmail, byTag] = await Promise.all([
      this.userService.findByEmail(email),
      this.userService.findByTag(tag),
    ]);
    if (byEmail) throw new UserAlreadyExistsError('email');
    if (byTag) throw new UserAlreadyExistsError('tag');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userService.create({
      email,
      nickname,
      tag,
      passwordHash,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.userService.setOtp(user.id!, otp);
    await this.mailService.send(otpEmail(user.email, otp));
  }
}
