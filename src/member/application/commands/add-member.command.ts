import type { Permission, Role } from '../../domain/member.enum';

export class AddMemberCommand {
  constructor(
    public readonly chatId: number,
    public readonly userId: number,
    public readonly requestingMemberId: number,
    public readonly role?: Role,
    public readonly permissions?: Permission[],
  ) {}
}
