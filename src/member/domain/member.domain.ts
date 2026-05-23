import { Permission, Role, ROLE_RANK } from './member.enum';

export class MemberDomain {
  constructor(
    public readonly id: number | undefined,
    public readonly userId: number,
    public readonly chatId: number,
    private _role: Role,
    private _permissions: Permission[],
    private _bannedAt: Date | null,
    private _leftAt: Date | null,
  ) {}

  get role(): Role {
    return this._role;
  }
  get permissions(): Permission[] {
    return this._permissions;
  }
  get bannedAt(): Date | null {
    return this._bannedAt;
  }
  get leftAt(): Date | null {
    return this._leftAt;
  }

  hasPermission(permission: Permission): boolean {
    return (
      this._role === Role.SUPER_ADMIN || this._permissions.includes(permission)
    );
  }

  canActOn(target: MemberDomain): boolean {
    if (this.id === target.id) return false;
    if (this._role === Role.SUPER_ADMIN) return true;
    return ROLE_RANK[this._role] > ROLE_RANK[target._role];
  }

  isBanned(): boolean {
    return this._bannedAt !== null;
  }

  hasLeft(): boolean {
    return this._leftAt !== null;
  }

  isActive(): boolean {
    return !this.isBanned() && !this.hasLeft();
  }

  ban(): void {
    this._bannedAt = new Date();
  }

  unban(): void {
    this._bannedAt = null;
  }

  leave(): void {
    this._leftAt = new Date();
  }

  setRole(role: Role, permissions: Permission[]): void {
    this._role = role;
    this._permissions = permissions;
  }

  updatePermissions(permissions: Permission[]): void {
    this._permissions = permissions;
  }

  rejoin(role: Role, permissions: Permission[]): void {
    this._leftAt = null;
    this._role = role;
    this._permissions = permissions;
  }
}
