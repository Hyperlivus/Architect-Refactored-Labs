export class MessageDomain {
  constructor(
    public readonly id: number | undefined,
    public readonly content: string,
    public readonly chatId: number,
    public readonly memberId: number,
    public readonly createdAt: Date | undefined,
    private _deletedAt: Date | null,
  ) {}

  get deletedAt(): Date | null { return this._deletedAt; }

  isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  isOwnedBy(memberId: number): boolean {
    return this.memberId === memberId;
  }

  delete(): void {
    this._deletedAt = new Date();
  }
}
