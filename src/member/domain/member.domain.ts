import { Permission, Role, ROLE_RANK } from './member.enum';

export class MemberDomain {
  constructor(
    public readonly id: number | undefined,
    public readonly userId: number,
    public readonly chatId: number,
    public role: Role,
    public permissions: Permission[],
    public bannedAt: Date | null,
    public leftAt: Date | null,
  ) {}

  hasPermission(permission: Permission): boolean {
    return (
      this.role === Role.SUPER_ADMIN || this.permissions.includes(permission)
    );
  }

  canActOn(target: MemberDomain): boolean {
    if (this.id === target.id) return false;
    if (this.role === Role.SUPER_ADMIN) return true;
    return ROLE_RANK[this.role] > ROLE_RANK[target.role];
  }

  isBanned(): boolean {
    return this.bannedAt !== null;
  }

  hasLeft(): boolean {
    return this.leftAt !== null;
  }

  isActive(): boolean {
    return !this.isBanned() && !this.hasLeft();
  }

  ban(): void {
    this.bannedAt = new Date();
  }

  unban(): void {
    this.bannedAt = null;
  }

  leave(): void {
    this.leftAt = new Date();
  }

  setRole(role: Role, permissions: Permission[]): void {
    this.role = role;
    this.permissions = permissions;
  }
}
