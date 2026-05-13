import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MEMBER_REPOSITORY } from '../../domain/member.repository.interface';
import type { IMemberRepository } from '../../domain/member.repository.interface';
import { DEFAULT_PERMISSIONS, Role, ROLE_RANK } from '../../domain/member.enum';
import {
  InsufficientPermissionsError,
  MemberNotFoundError,
} from '../../domain/member.errors';
import { toMemberReadModel } from '../read-models/member.read-model';
import type { MemberReadModel } from '../read-models/member.read-model';
import { UpdateMemberRoleCommand } from './update-member-role.command';

@CommandHandler(UpdateMemberRoleCommand)
export class UpdateMemberRoleHandler implements ICommandHandler<
  UpdateMemberRoleCommand,
  MemberReadModel
> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: UpdateMemberRoleCommand): Promise<MemberReadModel> {
    const { chatId, targetMemberId, role, requestingMemberId } = command;

    const [requesting, target] = await Promise.all([
      this.memberRepository.findById(requestingMemberId),
      this.memberRepository.findById(targetMemberId),
    ]);

    if (!requesting) throw new MemberNotFoundError();
    if (!target || target.chatId !== chatId) throw new MemberNotFoundError();

    if (!requesting.canActOn(target)) {
      throw new InsufficientPermissionsError(
        'Cannot change role of a member with equal or higher role',
      );
    }

    if (
      requesting.role !== Role.SUPER_ADMIN &&
      ROLE_RANK[role] >= ROLE_RANK[requesting.role]
    ) {
      throw new InsufficientPermissionsError(
        'Cannot assign a role equal to or higher than your own',
      );
    }

    target.setRole(role, DEFAULT_PERMISSIONS[role]);
    return toMemberReadModel(await this.memberRepository.save(target));
  }
}
