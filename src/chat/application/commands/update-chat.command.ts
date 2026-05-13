export class UpdateChatCommand {
  constructor(
    public readonly chatId: number,
    public readonly name: string | undefined,
    public readonly description: string | null | undefined,
  ) {}
}
