import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../domain/user.repository.interface';
import type { IUserRepository } from '../domain/user.repository.interface';
import { UserFactory } from '../domain/user.factory';
import type { UserDomain } from '../domain/user.domain';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  findById(id: number): Promise<UserDomain | null> {
    return this.userRepository.findById(id);
  }

  findByEmail(email: string): Promise<UserDomain | null> {
    return this.userRepository.findByEmail(email);
  }

  findByTag(tag: string): Promise<UserDomain | null> {
    return this.userRepository.findByTag(tag);
  }

  findByEmailOrTag(emailOrTag: string): Promise<UserDomain | null> {
    const isEmail = emailOrTag.includes('@');
    return isEmail
      ? this.userRepository.findByEmail(emailOrTag)
      : this.userRepository.findByTag(emailOrTag);
  }

  create(data: Parameters<typeof UserFactory.create>[0]): Promise<UserDomain> {
    return this.userRepository.save(UserFactory.create(data));
  }

  async setOtp(id: number, otp: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) return;
    user.setOtp(otp);
    await this.userRepository.save(user);
  }

  async verifyEmail(id: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) return;
    user.verifyEmail();
    await this.userRepository.save(user);
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) return;
    user.updatePassword(passwordHash);
    await this.userRepository.save(user);
  }

  async updateNickname(id: number, nickname: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) return;
    user.updateNickname(nickname);
    await this.userRepository.save(user);
  }
}
