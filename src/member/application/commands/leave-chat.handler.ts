import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MEMBER_REPOSITORY } from '../../domain/member.repository.interface';
import type { IMemberRepository } from '../../domain/member.repository.interface';
import { MemberNotFoundError } from '../../domain/member.errors';
import { LeaveChatCommand } from './leave-chat.command';

@CommandHandler(LeaveChatCommand)
export class LeaveChatHandler implements ICommandHandler<
  LeaveChatCommand,
  void
> {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(command: LeaveChatCommand): Promise<void> {
    const member = await this.memberRepository.findById(command.memberId);
    if (!member) throw new MemberNotFoundError();

    member.leave();
    await this.memberRepository.save(member);
  }
}
