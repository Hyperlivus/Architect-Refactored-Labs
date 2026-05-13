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

  async update(
    id: number,
    data: Partial<
      Pick<UserDomain, 'emailVerified' | 'otp' | 'passwordHash' | 'nickname'>
    >,
  ): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) return;
    if (data.nickname !== undefined) user.updateNickname(data.nickname);
    if (data.emailVerified !== undefined)
      user.emailVerified = data.emailVerified;
    if (data.otp !== undefined) user.otp = data.otp;
    if (data.passwordHash !== undefined) user.updatePassword(data.passwordHash);
    await this.userRepository.save(user);
  }
}
