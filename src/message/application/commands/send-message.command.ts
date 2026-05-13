export class SendMessageCommand {
  constructor(
    public readonly chatId: number,
    public readonly content: string,
    public readonly requestingMemberId: number,
  ) {}
}
