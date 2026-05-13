export class UnbanMemberCommand {
  constructor(
    public readonly chatId: number,
    public readonly targetMemberId: number,
    public readonly requestingMemberId: number,
  ) {}
}
