import type { Permission } from '../../domain/member.enum';

export class UpdateMemberPermissionsCommand {
  constructor(
    public readonly chatId: number,
    public readonly targetMemberId: number,
    public readonly permissions: Permission[],
    public readonly requestingMemberId: number,
  ) {}
}
