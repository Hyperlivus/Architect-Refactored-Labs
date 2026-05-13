import { Inject, Injectable } from '@nestjs/common';
import { MESSAGE_REPOSITORY } from '../domain/message.repository.interface';
import type { IMessageRepository } from '../domain/message.repository.interface';
import { MessageNotFoundError } from '../domain/message.errors';
import { MessageFactory } from '../domain/message.factory';
import { Permission } from '../../member/domain/member.enum';
import { InsufficientPermissionsError } from '../../member/domain/member.errors';
import type { MemberDomain } from '../../member/domain/member.domain';
import type { MessageDomain } from '../domain/message.domain';
import type { SendMessageDto } from './message.dto';
import type { PaginationDto } from '../../shared/pagination.dto';

@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
  ) {}

  async send(
    chatId: number,
    dto: SendMessageDto,
    member: MemberDomain,
  ): Promise<MessageDomain> {
    const data = MessageFactory.create({
      content: dto.content,
      chatId,
      memberId: member.id!,
    });
    return this.messageRepository.save(data);
  }

  async list(
    chatId: number,
    dto: PaginationDto,
  ): Promise<{ items: MessageDomain[]; total: number }> {
    return this.messageRepository.list(
      chatId,
      (dto.page - 1) * dto.limit,
      dto.limit,
    );
  }

  async delete(
    messageId: number,
    chatId: number,
    requesting: MemberDomain,
  ): Promise<void> {
    const message = await this.messageRepository.findActiveById(
      messageId,
      chatId,
    );
    if (!message) throw new MessageNotFoundError();

    if (
      !message.isOwnedBy(requesting.id!) &&
      !requesting.hasPermission(Permission.DELETE_MESSAGES)
    ) {
      throw new InsufficientPermissionsError(
        'You can only delete your own messages',
      );
    }

    message.delete();
    await this.messageRepository.save(message);
  }
}
