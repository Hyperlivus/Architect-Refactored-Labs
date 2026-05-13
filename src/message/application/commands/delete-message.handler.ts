import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MESSAGE_REPOSITORY } from '../../domain/message.repository.interface';
import type { IMessageRepository } from '../../domain/message.repository.interface';
import { MessageNotFoundError } from '../../domain/message.errors';
import { Permission } from '../../../member/domain/member.enum';
import { InsufficientPermissionsError } from '../../../member/domain/member.errors';
import { MemberNotFoundError } from '../../../member/domain/member.errors';
import { MemberService } from '../../../member/application/member.service';
import { DeleteMessageCommand } from './delete-message.command';

@CommandHandler(DeleteMessageCommand)
export class DeleteMessageHandler
  implements ICommandHandler<DeleteMessageCommand, void>
{
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    private readonly memberService: MemberService,
  ) {}

  async execute(command: DeleteMessageCommand): Promise<void> {
    const { messageId, chatId, requestingMemberId } = command;

    const [message, requesting] = await Promise.all([
      this.messageRepository.findActiveById(messageId, chatId),
      this.memberService.findById(requestingMemberId),
    ]);

    if (!message) throw new MessageNotFoundError();
    if (!requesting) throw new MemberNotFoundError();

    if (
      !message.isOwnedBy(requestingMemberId) &&
      !requesting.hasPermission(Permission.DELETE_MESSAGES)
    ) {
      throw new InsufficientPermissionsError('You can only delete your own messages');
    }

    message.delete();
    await this.messageRepository.save(message);
  }
}
