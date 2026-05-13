export class MessageDomain {
  constructor(
    public readonly id: number | undefined,
    public readonly content: string,
    public readonly chatId: number,
    public readonly memberId: number,
    public readonly createdAt: Date | undefined,
    public deletedAt: Date | null,
    public readonly scheduledAt: Date | null = null,
    public sentAt: Date | null = null,
  ) {}

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  isOwnedBy(memberId: number): boolean {
    return this.memberId === memberId;
  }

  delete(): void {
    this.deletedAt = new Date();
  }
}
