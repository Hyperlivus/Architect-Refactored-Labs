import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../user/application/user.service';
import type { IMailService } from '../../mail/mail.service.interface';
import { MAIL_SERVICE } from '../../mail/mail.service.interface';
import { UserAlreadyExistsError } from '../../user/domain/user.errors';
import {
  InvalidCredentialsError,
  EmailNotVerifiedError,
  InvalidOtpError,
} from '../domain/auth.errors';
import { otpEmail } from './auth.email-templates';
import type {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendOtpDto,
} from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private sign(userId: number, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  async register(dto: RegisterDto): Promise<void> {
    const [byEmail, byTag] = await Promise.all([
      this.userService.findByEmail(dto.email),
      this.userService.findByTag(dto.tag),
    ]);
    if (byEmail) throw new UserAlreadyExistsError('email');
    if (byTag) throw new UserAlreadyExistsError('tag');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      email: dto.email,
      nickname: dto.nickname,
      tag: dto.tag,
      passwordHash,
    });

    const otp = this.generateOtp();
    await this.userService.setOtp(user.id!, otp);
    await this.mailService.send(otpEmail(user.email, otp));
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userService.findByEmailOrTag(dto.emailOrTag);
    if (!user) throw new InvalidCredentialsError();

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new InvalidCredentialsError();

    if (!user.emailVerified) throw new EmailNotVerifiedError();

    return { accessToken: this.sign(user.id!, user.email) };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ accessToken: string }> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError();
    if (!user.otp || user.otp !== dto.otp) throw new InvalidOtpError();

    await this.userService.verifyEmail(user.id!);

    return { accessToken: this.sign(user.id!, user.email) };
  }

  async requestNewOtp(dto: ResendOtpDto): Promise<void> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new InvalidCredentialsError();

    const otp = this.generateOtp();
    await this.userService.setOtp(user.id!, otp);
    await this.mailService.send(otpEmail(user.email, otp));
  }
}
