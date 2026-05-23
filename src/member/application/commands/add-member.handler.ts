import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MEMBER_REPOSITORY } from '../../domain/member.repository.interface';
import type { IMemberRepository } from '../../domain/member.repository.interface';
import { MemberFactory } from '../../domain/member.factory';
import { DEFAULT_PERMISSIONS, Role, ROLE_RANK } from '../../domain/member.enum';
import {
  AlreadyMemberError,
  InsufficientPermissionsError,
  MemberBannedError,
  MemberNotFoundError,
} from '../../domain/member.errors';
import { UserService } from '../../../user/application/user.service';
import { UserNotFoundError } from '../../../user/domain/user.errors';
import { toMemberReadModel } from '../read-models/member.read-model';
import type { MemberReadModel } from '../read-models/member.read-model';
import { AddMemberCommand } from './add-member.command';

@CommandHandler(AddMemberCommand)
export class AddMemberHandler
  implements ICommandHandler<AddMemberCommand, MemberReadModel>
{
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
    private readonly userService: UserService,
  ) {}

  async execute(command: AddMemberCommand): Promise<MemberReadModel> {
    const { chatId, userId, requestingMemberId, role, permissions } = command;

    const [requesting, targetUser, existing] = await Promise.all([
      this.memberRepository.findById(requestingMemberId),
      this.userService.findById(userId),
      this.memberRepository.findByChatAndUser(chatId, userId),
    ]);

    if (!requesting) throw new MemberNotFoundError();
    if (!targetUser) throw new UserNotFoundError();
    if (existing?.isBanned()) throw new MemberBannedError();

    const assignedRole = role ?? Role.MEMBER;

    if (
      requesting.role !== Role.SUPER_ADMIN &&
      ROLE_RANK[assignedRole] >= ROLE_RANK[requesting.role]
    ) {
      throw new InsufficientPermissionsError(
        'Cannot assign a role equal to or higher than your own',
      );
    }

    const domain = MemberFactory.create({
      chatId,
      userId,
      role: assignedRole,
      permissions,
    });

    if (existing?.hasLeft()) {
      existing.leftAt = null;
      existing.role = domain.role;
      existing.permissions = domain.permissions;
      return toMemberReadModel(await this.memberRepository.save(existing));
    }

    if (existing) throw new AlreadyMemberError();

    return toMemberReadModel(await this.memberRepository.save(domain));
  }
}
