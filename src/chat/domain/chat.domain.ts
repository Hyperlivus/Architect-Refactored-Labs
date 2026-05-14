import { InvalidChatDataError } from './chat.errors';

export class ChatDomain {
  constructor(
    public readonly id: number | undefined,
    private _name: string,
    public readonly tag: string,
    private _description: string | null,
  ) {}

  get name(): string { return this._name; }
  get description(): string | null { return this._description; }

  updateInfo(dto: { name?: string; description?: string | null }): void {
    if (dto.name !== undefined) {
      if (dto.name.length < 2 || dto.name.length > 100) {
        throw new InvalidChatDataError(
          'Chat name must be between 2 and 100 characters',
        );
      }
      this._name = dto.name;
    }
    if (dto.description !== undefined) {
      if (dto.description && dto.description.length > 500) {
        throw new InvalidChatDataError(
          'Description must not exceed 500 characters',
        );
      }
      this._description = dto.description;
    }
  }
}
