import { Inject, Injectable } from '@nestjs/common';
import { UserDomain } from './user.domain';
import { UserAlreadyExistsError } from './user.errors';
import {
  type IUserRepository,
  USER_REPOSITORY,
} from './user.repository.interface';

export interface CreateUserParams {
  email: string;
  nickname: string;
  tag: string;
  passwordHash: string;
}

@Injectable()
export class UserFactory {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async create(params: CreateUserParams): Promise<UserDomain> {
    const [byEmail, byTag] = await Promise.all([
      this.userRepository.findByEmail(params.email),
      this.userRepository.findByTag(params.tag),
    ]);

    if (byEmail) throw new UserAlreadyExistsError('email');
    if (byTag) throw new UserAlreadyExistsError('tag');

    return new UserDomain(
      undefined,
      params.email.toLowerCase(),
      params.nickname,
      params.tag,
      params.passwordHash,
      false,
      null,
    );
  }
}
