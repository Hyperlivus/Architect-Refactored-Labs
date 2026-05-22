import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from '../../../../src/member/application/member.service';
import {
  MEMBER_REPOSITORY,
  IMemberRepository,
} from '../../../../src/member/domain/member.repository.interface';
import { MemberDomain } from '../../../../src/member/domain/member.domain';
import { DEFAULT_PERMISSIONS, Permission, Role } from '../../../../src/member/domain/member.enum';
import {
  AlreadyMemberError,
  InsufficientPermissionsError,
  MemberBannedError,
  MemberNotFoundError,
} from '../../../../src/member/domain/member.errors';
import { UserService } from '../../../../src/user/application/user.service';
import { UserNotFoundError } from '../../../../src/user/domain/user.errors';

const mockMemberRepo: Partial<IMemberRepository> = {
  findByChatAndUser: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
};

const mockUserService = { findById: jest.fn() };

const make = (
  overrides: {
    id?: number;
    userId?: number;
    chatId?: number;
    role?: Role;
    permissions?: Permission[];
    bannedAt?: Date | null;
    leftAt?: Date | null;
  } = {},
): MemberDomain =>
  new MemberDomain(
    overrides.id ?? 10,
    overrides.userId ?? 1,
    overrides.chatId ?? 5,
    overrides.role ?? Role.MEMBER,
    overrides.permissions ?? [Permission.SEND_MESSAGES],
    overrides.bannedAt ?? null,
    overrides.leftAt ?? null,
  );

describe('MemberService', () => {
  let service: MemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: MEMBER_REPOSITORY, useValue: mockMemberRepo },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get(MemberService);
    jest.clearAllMocks();
  });

  describe('addMember', () => {
    const requesting = make({
      id: 1,
      role: Role.ADMIN,
      permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
    });

    it('should create a new member with default MEMBER role', async () => {
      mockUserService.findById.mockResolvedValue({ id: 2 });
      (mockMemberRepo.findByChatAndUser as jest.Mock).mockResolvedValue(null);
      const newMember = make({ id: 20, userId: 2 });
      (mockMemberRepo.save as jest.Mock).mockResolvedValue(newMember);

      const result = await service.addMember(5, { userId: 2 }, requesting);

      expect(mockMemberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          role: Role.MEMBER,
          permissions: DEFAULT_PERMISSIONS[Role.MEMBER],
        }),
      );
      expect(result).toEqual(newMember);
    });

    it('should reactivate a previously left member', async () => {
      const leftMember = make({ leftAt: new Date(), userId: 2 });
      mockUserService.findById.mockResolvedValue({ id: 2 });
      (mockMemberRepo.findByChatAndUser as jest.Mock).mockResolvedValue(leftMember);
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      const result = await service.addMember(5, { userId: 2 }, requesting);

      expect(result.leftAt).toBeNull();
    });

    it('should throw MemberBannedError when target is banned', async () => {
      mockUserService.findById.mockResolvedValue({ id: 2 });
      (mockMemberRepo.findByChatAndUser as jest.Mock).mockResolvedValue(
        make({ bannedAt: new Date() }),
      );

      await expect(
        service.addMember(5, { userId: 2 }, requesting),
      ).rejects.toThrow(MemberBannedError);
    });

    it('should throw AlreadyMemberError when already an active member', async () => {
      mockUserService.findById.mockResolvedValue({ id: 2 });
      (mockMemberRepo.findByChatAndUser as jest.Mock).mockResolvedValue(
        make({ userId: 2 }),
      );

      await expect(
        service.addMember(5, { userId: 2 }, requesting),
      ).rejects.toThrow(AlreadyMemberError);
    });

    it('should throw UserNotFoundError when target user does not exist', async () => {
      mockUserService.findById.mockResolvedValue(null);

      await expect(
        service.addMember(5, { userId: 99 }, requesting),
      ).rejects.toThrow(UserNotFoundError);
    });

    it('should throw InsufficientPermissionsError when ADMIN tries to assign ADMIN role', async () => {
      mockUserService.findById.mockResolvedValue({ id: 2 });
      (mockMemberRepo.findByChatAndUser as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addMember(5, { userId: 2, role: Role.ADMIN }, requesting),
      ).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should allow SUPER_ADMIN to assign ADMIN role', async () => {
      const superAdmin = make({ id: 1, role: Role.SUPER_ADMIN });
      mockUserService.findById.mockResolvedValue({ id: 2 });
      (mockMemberRepo.findByChatAndUser as jest.Mock).mockResolvedValue(null);
      const newAdmin = make({ id: 20, role: Role.ADMIN });
      (mockMemberRepo.save as jest.Mock).mockResolvedValue(newAdmin);

      const result = await service.addMember(
        5,
        { userId: 2, role: Role.ADMIN },
        superAdmin,
      );
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  describe('ban', () => {
    it('should call ban() on target and persist when actor has permission', async () => {
      const actor = make({
        id: 1,
        role: Role.ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
      });
      const target = make({ id: 2, role: Role.MEMBER });
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      await service.ban(target, actor);

      expect(target.isBanned()).toBe(true);
      expect(mockMemberRepo.save).toHaveBeenCalledWith(target);
    });

    it('should throw when actor lacks BAN_MEMBERS permission', async () => {
      await expect(
        service.ban(make({ id: 2 }), make({ id: 1, permissions: [] })),
      ).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should throw when ADMIN tries to ban another ADMIN', async () => {
      const actor = make({
        id: 1,
        role: Role.ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
      });
      const target = make({ id: 2, role: Role.ADMIN });
      await expect(service.ban(target, actor)).rejects.toThrow(
        InsufficientPermissionsError,
      );
    });

    it('should be a no-op when target is already banned', async () => {
      const actor = make({ id: 1, role: Role.SUPER_ADMIN });
      const target = make({ id: 2, bannedAt: new Date() });

      await service.ban(target, actor);
      expect(mockMemberRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('leave', () => {
    it('should call leave() on member and persist', async () => {
      const member = make();
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      await service.leave(member);

      expect(member.hasLeft()).toBe(true);
      expect(mockMemberRepo.save).toHaveBeenCalledWith(member);
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions when actor has EDIT_PERMISSIONS and higher role', async () => {
      const actor = make({
        id: 1,
        role: Role.SUPER_ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.SUPER_ADMIN],
      });
      const target = make({ id: 2, role: Role.MEMBER });
      const dto = {
        permissions: [Permission.SEND_MESSAGES, Permission.ADD_MEMBERS],
      };
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      const result = await service.updatePermissions(target, dto, actor);
      expect(result.permissions).toEqual(dto.permissions);
    });

    it('should throw when actor lacks EDIT_PERMISSIONS permission', async () => {
      await expect(
        service.updatePermissions(
          make({ id: 2 }),
          { permissions: [] },
          make({ id: 1, permissions: [] }),
        ),
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('updateRole', () => {
    it('should update role and reset permissions to defaults', async () => {
      const actor = make({ id: 1, role: Role.SUPER_ADMIN });
      const target = make({ id: 2, role: Role.MEMBER });
      (mockMemberRepo.save as jest.Mock).mockImplementation((m: MemberDomain) =>
        Promise.resolve(m),
      );

      const result = await service.updateRole(
        target,
        { role: Role.ADMIN },
        actor,
      );

      expect(result.role).toBe(Role.ADMIN);
      expect(result.permissions).toEqual(DEFAULT_PERMISSIONS[Role.ADMIN]);
    });

    it('should throw when ADMIN tries to promote to ADMIN', async () => {
      await expect(
        service.updateRole(
          make({ id: 2, role: Role.MEMBER }),
          { role: Role.ADMIN },
          make({
            id: 1,
            role: Role.ADMIN,
            permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
          }),
        ),
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('getTargetMember', () => {
    it('should return the member when found in the correct chat', async () => {
      const member = make({ id: 10, chatId: 5 });
      (mockMemberRepo.findById as jest.Mock).mockResolvedValue(member);

      expect(await service.getTargetMember(5, 10)).toEqual(member);
    });

    it('should throw MemberNotFoundError when member is from a different chat', async () => {
      (mockMemberRepo.findById as jest.Mock).mockResolvedValue(
        make({ id: 10, chatId: 99 }),
      );
      await expect(service.getTargetMember(5, 10)).rejects.toThrow(
        MemberNotFoundError,
      );
    });
  });
});