import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MEMBER_REPOSITORY } from '../../domain/member.repository.interface';
import type { IMemberRepository } from '../../domain/member.repository.interface';
import {
  InsufficientPermissionsError,
  MemberNotFoundError,
} from '../../domain/member.errors';
import { UnbanMemberCommand } from './unban-member.command';

@CommandHandler(UnbanMemberCommand)
export class UnbanMemberHandler implements ICommandHandler<
  UnbanMemberCommand,
  void
> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: UnbanMemberCommand): Promise<void> {
    const { chatId, targetMemberId, requestingMemberId } = command;

    const [requesting, target] = await Promise.all([
      this.memberRepository.findById(requestingMemberId),
      this.memberRepository.findById(targetMemberId),
    ]);

    if (!requesting) throw new MemberNotFoundError();
    if (!target || target.chatId !== chatId) throw new MemberNotFoundError();

    if (!requesting.canActOn(target)) {
      throw new InsufficientPermissionsError(
        'Cannot unban a member with equal or higher role',
      );
    }

    target.unban();
    await this.memberRepository.save(target);
  }
}
