export class ScheduleMessageCommand {
  constructor(
    public readonly chatId: number,
    public readonly content: string,
    public readonly requestingMemberId: number,
    public readonly scheduledAt: Date,
  ) {}
}
