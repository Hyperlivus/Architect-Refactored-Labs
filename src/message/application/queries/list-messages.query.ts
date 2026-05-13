export class ListMessagesQuery {
  constructor(
    public readonly chatId: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
