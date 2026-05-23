import { MemberDomain } from '../../src/member/domain/member.domain';
import {
  DEFAULT_PERMISSIONS,
  Permission,
  Role,
} from '../../src/member/domain/member.enum';

const make = (
  overrides: {
    id?: number;
    role?: Role;
    permissions?: Permission[];
    bannedAt?: Date | null;
    leftAt?: Date | null;
  } = {},
): MemberDomain =>
  new MemberDomain(
    overrides.id ?? 10,
    1,
    5,
    overrides.role ?? Role.MEMBER,
    overrides.permissions ?? [Permission.SEND_MESSAGES],
    overrides.bannedAt ?? null,
    overrides.leftAt ?? null,
  );

describe('MemberDomain', () => {
  describe('hasPermission', () => {
    it('should return true for SUPER_ADMIN regardless of permission', () => {
      const member = make({ role: Role.SUPER_ADMIN, permissions: [] });
      expect(member.hasPermission(Permission.BAN_MEMBERS)).toBe(true);
    });

    it('should return true when member has the permission', () => {
      const member = make({ permissions: [Permission.BAN_MEMBERS] });
      expect(member.hasPermission(Permission.BAN_MEMBERS)).toBe(true);
    });

    it('should return false when member does not have the permission', () => {
      const member = make({ permissions: [Permission.SEND_MESSAGES] });
      expect(member.hasPermission(Permission.BAN_MEMBERS)).toBe(false);
    });
  });

  describe('canActOn', () => {
    it('should return false when actor targets themselves', () => {
      const member = make({ id: 1 });
      expect(member.canActOn(member)).toBe(false);
    });

    it('should return true for SUPER_ADMIN acting on any other member', () => {
      const actor = make({ id: 1, role: Role.SUPER_ADMIN });
      const target = make({ id: 2, role: Role.ADMIN });
      expect(actor.canActOn(target)).toBe(true);
    });

    it('should return true for ADMIN acting on MEMBER', () => {
      const actor = make({ id: 1, role: Role.ADMIN });
      const target = make({ id: 2, role: Role.MEMBER });
      expect(actor.canActOn(target)).toBe(true);
    });

    it('should return false for ADMIN acting on another ADMIN', () => {
      const actor = make({ id: 1, role: Role.ADMIN });
      const target = make({ id: 2, role: Role.ADMIN });
      expect(actor.canActOn(target)).toBe(false);
    });

    it('should return false for MEMBER acting on anyone', () => {
      const actor = make({ id: 1, role: Role.MEMBER });
      const target = make({ id: 2, role: Role.MEMBER });
      expect(actor.canActOn(target)).toBe(false);
    });
  });

  describe('isBanned / hasLeft / isActive', () => {
    it('isBanned returns true when bannedAt is set', () => {
      expect(make({ bannedAt: new Date() }).isBanned()).toBe(true);
    });

    it('isBanned returns false when bannedAt is null', () => {
      expect(make({ bannedAt: null }).isBanned()).toBe(false);
    });

    it('hasLeft returns true when leftAt is set', () => {
      expect(make({ leftAt: new Date() }).hasLeft()).toBe(true);
    });

    it('isActive returns false when banned', () => {
      expect(make({ bannedAt: new Date() }).isActive()).toBe(false);
    });

    it('isActive returns false when left', () => {
      expect(make({ leftAt: new Date() }).isActive()).toBe(false);
    });

    it('isActive returns true when neither banned nor left', () => {
      expect(make().isActive()).toBe(true);
    });
  });

  describe('ban / unban / leave', () => {
    it('ban sets bannedAt to a date', () => {
      const member = make();
      member.ban();
      expect(member.bannedAt).toBeInstanceOf(Date);
    });

    it('unban clears bannedAt', () => {
      const member = make({ bannedAt: new Date() });
      member.unban();
      expect(member.bannedAt).toBeNull();
    });

    it('leave sets leftAt to a date', () => {
      const member = make();
      member.leave();
      expect(member.leftAt).toBeInstanceOf(Date);
    });
  });

  describe('setRole', () => {
    it('should update role and permissions', () => {
      const member = make({ role: Role.MEMBER });
      member.setRole(Role.ADMIN, DEFAULT_PERMISSIONS[Role.ADMIN]);
      expect(member.role).toBe(Role.ADMIN);
      expect(member.permissions).toEqual(DEFAULT_PERMISSIONS[Role.ADMIN]);
    });
  });
});
