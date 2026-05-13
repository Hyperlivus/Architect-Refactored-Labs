export class DeleteMessageCommand {
  constructor(
    public readonly messageId: number,
    public readonly chatId: number,
    public readonly requestingMemberId: number,
  ) {}
}
