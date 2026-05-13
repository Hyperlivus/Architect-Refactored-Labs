export class BanMemberCommand {
  constructor(
    public readonly chatId: number,
    public readonly targetMemberId: number,
    public readonly requestingMemberId: number,
  ) {}
}
