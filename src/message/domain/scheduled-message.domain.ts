import { MessageDomain } from './message.domain';

export class ScheduledMessageDomain extends MessageDomain {
  constructor(
    id: number | undefined,
    content: string,
    chatId: number,
    memberId: number,
    createdAt: Date | undefined,
    deletedAt: Date | null,
    scheduledAt: Date,
    sentAt: Date | null,
  ) {
    super(
      id,
      content,
      chatId,
      memberId,
      createdAt,
      deletedAt,
      scheduledAt,
      sentAt,
    );
  }

  isPending(): boolean {
    return this.sentAt === null;
  }

  deliver(): void {
    this.sentAt = new Date();
  }
}
