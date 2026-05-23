import { Inject, Injectable } from '@nestjs/common';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from '../domain/user.repository.interface';
import { UserFactory, CreateUserParams } from '../domain/user.factory';
import type { UserDomain } from '../domain/user.domain';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly userFactory: UserFactory,
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
    return emailOrTag.includes('@')
      ? this.userRepository.findByEmail(emailOrTag)
      : this.userRepository.findByTag(emailOrTag);
  }

  async create(params: CreateUserParams): Promise<UserDomain> {
    const user = await this.userFactory.create(params);
    return this.userRepository.create(user);
  }

  async update(
    id: number,
    data: Partial<{
      nickname: string;
      otp: string | null;
      passwordHash: string;
      emailVerified: boolean;
    }>,
  ): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) return;

    if (data.emailVerified === true) {
      user.verifyEmail();
    } else if (data.otp !== undefined) {
      if (data.otp === null) {
        user.clearOtp();
      } else {
        user.setOtp(data.otp);
      }
    }
    if (data.nickname !== undefined) user.updateNickname(data.nickname);
    if (data.passwordHash !== undefined) user.updatePassword(data.passwordHash);

    await this.userRepository.save(user);
  }
}
