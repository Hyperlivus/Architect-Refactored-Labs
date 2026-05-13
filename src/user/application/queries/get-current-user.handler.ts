import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY } from '../../domain/user.repository.interface';
import type { IUserRepository } from '../../domain/user.repository.interface';
import { UserNotFoundError } from '../../domain/user.errors';
import { toUserReadModel } from '../read-models/user.read-model';
import type { UserReadModel } from '../read-models/user.read-model';
import { GetCurrentUserQuery } from './get-current-user.query';

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler
  implements IQueryHandler<GetCurrentUserQuery, UserReadModel>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetCurrentUserQuery): Promise<UserReadModel> {
    const user = await this.userRepository.findById(query.userId);
    if (!user) throw new UserNotFoundError();
    return toUserReadModel(user);
  }
}
