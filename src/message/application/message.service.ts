import { Inject, Injectable } from '@nestjs/common';
import { MESSAGE_REPOSITORY } from '../domain/message.repository.interface';
import type { IMessageRepository } from '../domain/message.repository.interface';
import { MessageNotFoundError } from '../domain/message.errors';
import { MessageFactory } from '../domain/message.factory';
import type { MemberDomain } from '../../member/domain/member.domain';
import type { MessageDomain } from '../domain/message.domain';
import type { SendMessageDto } from './message.dto';
import type { PaginationDto } from '../../shared/pagination.dto';

@Injectable()
export class MessageService {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    private readonly messageFactory: MessageFactory,
  ) {}

  async send(
    chatId: number,
    dto: SendMessageDto,
    member: MemberDomain,
  ): Promise<MessageDomain> {
    const data = this.messageFactory.create(
      { content: dto.content, chatId, memberId: member.id! },
      member,
    );
    return this.messageRepository.create(data);
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

    this.messageFactory.delete(message, requesting);

    message.delete();
    await this.messageRepository.save(message);
  }
}
