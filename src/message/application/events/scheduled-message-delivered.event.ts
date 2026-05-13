export class ScheduledMessageDeliveredEvent {
  constructor(
    public readonly messageId: number,
    public readonly chatId: number,
    public readonly memberId: number,
    public readonly content: string,
    public readonly deliveredAt: Date,
  ) {}
}
