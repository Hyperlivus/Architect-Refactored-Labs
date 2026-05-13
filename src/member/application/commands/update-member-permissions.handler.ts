import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MEMBER_REPOSITORY } from '../../domain/member.repository.interface';
import type { IMemberRepository } from '../../domain/member.repository.interface';
import {
  InsufficientPermissionsError,
  MemberNotFoundError,
} from '../../domain/member.errors';
import { toMemberReadModel } from '../read-models/member.read-model';
import type { MemberReadModel } from '../read-models/member.read-model';
import { UpdateMemberPermissionsCommand } from './update-member-permissions.command';

@CommandHandler(UpdateMemberPermissionsCommand)
export class UpdateMemberPermissionsHandler
  implements ICommandHandler<UpdateMemberPermissionsCommand, MemberReadModel>
{
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(
    command: UpdateMemberPermissionsCommand,
  ): Promise<MemberReadModel> {
    const { chatId, targetMemberId, permissions, requestingMemberId } = command;

    const [requesting, target] = await Promise.all([
      this.memberRepository.findById(requestingMemberId),
      this.memberRepository.findById(targetMemberId),
    ]);

    if (!requesting) throw new MemberNotFoundError();
    if (!target || target.chatId !== chatId) throw new MemberNotFoundError();

    if (!requesting.canActOn(target)) {
      throw new InsufficientPermissionsError(
        'Cannot edit permissions of a member with equal or higher role',
      );
    }

    target.permissions = permissions;
    return toMemberReadModel(await this.memberRepository.save(target));
  }
}
