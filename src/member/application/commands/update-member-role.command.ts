import type { Role } from '../../domain/member.enum';

export class UpdateMemberRoleCommand {
  constructor(
    public readonly chatId: number,
    public readonly targetMemberId: number,
    public readonly role: Role,
    public readonly requestingMemberId: number,
  ) {}
}
