export class CreateChatCommand {
  constructor(
    public readonly name: string,
    public readonly tag: string,
    public readonly description: string | null | undefined,
    public readonly userId: number,
  ) {}
}
