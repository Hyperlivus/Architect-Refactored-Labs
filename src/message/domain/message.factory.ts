import { Injectable } from '@nestjs/common';
import { DomainError } from '../../shared/domain.error';
import { MessageDomain } from './message.domain';
import type { MemberDomain } from '../../member/domain/member.domain';
import { Permission } from '../../member/domain/member.enum';
import { InsufficientPermissionsError } from '../../member/domain/member.errors';

export class InvalidMessageDataError extends DomainError {
  constructor(reason: string) {
    super(reason);
  }
}

@Injectable()
export class MessageFactory {
  private static readonly MAX_LENGTH = 4000;

  create(
    params: { content: string; chatId: number; memberId: number },
    member: MemberDomain,
  ): MessageDomain {
    if (!member.hasPermission(Permission.SEND_MESSAGES)) {
      throw new InsufficientPermissionsError(
        'You do not have permission to send messages',
      );
    }
    if (!params.content.trim()) {
      throw new InvalidMessageDataError('Message content cannot be empty');
    }
    if (params.content.length > MessageFactory.MAX_LENGTH) {
      throw new InvalidMessageDataError(
        `Message content cannot exceed ${MessageFactory.MAX_LENGTH} characters`,
      );
    }

    return new MessageDomain(
      undefined,
      params.content,
      params.chatId,
      params.memberId,
      undefined,
      null,
    );
  }

  delete(message: MessageDomain, requesting: MemberDomain): void {
    if (
      !message.isOwnedBy(requesting.id!) &&
      !requesting.hasPermission(Permission.DELETE_MESSAGES)
    ) {
      throw new InsufficientPermissionsError(
        'You can only delete your own messages',
      );
    }
  }
}
