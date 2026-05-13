import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MEMBER_REPOSITORY } from '../../domain/member.repository.interface';
import type { IMemberRepository } from '../../domain/member.repository.interface';
import {
  InsufficientPermissionsError,
  MemberNotFoundError,
} from '../../domain/member.errors';
import { BanMemberCommand } from './ban-member.command';

@CommandHandler(BanMemberCommand)
export class BanMemberHandler implements ICommandHandler<BanMemberCommand, void> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: BanMemberCommand): Promise<void> {
    const { chatId, targetMemberId, requestingMemberId } = command;

    const [requesting, target] = await Promise.all([
      this.memberRepository.findById(requestingMemberId),
      this.memberRepository.findById(targetMemberId),
    ]);

    if (!requesting) throw new MemberNotFoundError();
    if (!target || target.chatId !== chatId) throw new MemberNotFoundError();

    if (!requesting.canActOn(target)) {
      throw new InsufficientPermissionsError(
        'Cannot ban a member with equal or higher role',
      );
    }

    if (target.isBanned()) return;

    target.ban();
    await this.memberRepository.save(target);
  }
}
