import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CHAT_REPOSITORY } from '../../domain/chat.repository.interface';
import type { IChatRepository } from '../../domain/chat.repository.interface';
import { ChatFactory } from '../../domain/chat.factory';
import { ChatTagTakenError } from '../../domain/chat.errors';
import { MemberService } from '../../../member/application/member.service';
import { CreateChatCommand } from './create-chat.command';

@CommandHandler(CreateChatCommand)
export class CreateChatHandler implements ICommandHandler<
  CreateChatCommand,
  number
> {
  constructor(
    @Inject(CHAT_REPOSITORY) private readonly chatRepository: IChatRepository,
    private readonly memberService: MemberService,
  ) {}

  async execute(command: CreateChatCommand): Promise<number> {
    const { name, tag, description, userId } = command;

    const existing = await this.chatRepository.findByTag(tag);
    if (existing) throw new ChatTagTakenError();

    const chat = await this.chatRepository.save(
      ChatFactory.create({ name, tag, description }),
    );
    await this.memberService.createOwner(chat.id!, userId);
    return chat.id!;
  }
}
