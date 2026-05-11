import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MemberService } from './member.service';
import { Member } from './member.entity';
import { DEFAULT_PERMISSIONS, Permission, Role } from './member.enum';
import {
  AlreadyMemberError,
  InsufficientPermissionsError,
  MemberBannedError,
  MemberNotFoundError,
} from './member.errors';
import { UserService } from '../user/user.service';
import { UserNotFoundError } from '../user/user.errors';

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockUserService = { findOne: jest.fn() };

const makeMember = (overrides: Partial<Member> = {}): Member => ({
  id: 10,
  userId: 1,
  chatId: 5,
  role: Role.MEMBER,
  permissions: [Permission.SEND_MESSAGES],
  bannedAt: null,
  leftAt: null,
  ...overrides,
});

describe('MemberService', () => {
  let service: MemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: getRepositoryToken(Member), useValue: mockRepo },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get(MemberService);
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('should return true for SUPER_ADMIN regardless of permission', () => {
      const member = makeMember({ role: Role.SUPER_ADMIN, permissions: [] });
      expect(service.hasPermission(member, Permission.BAN_MEMBERS)).toBe(true);
    });

    it('should return true when member has the permission', () => {
      const member = makeMember({ permissions: [Permission.BAN_MEMBERS] });
      expect(service.hasPermission(member, Permission.BAN_MEMBERS)).toBe(true);
    });

    it('should return false when member does not have the permission', () => {
      const member = makeMember({ permissions: [Permission.SEND_MESSAGES] });
      expect(service.hasPermission(member, Permission.BAN_MEMBERS)).toBe(false);
    });
  });

  describe('canActOn', () => {
    it('should return false when actor targets themselves', () => {
      const member = makeMember({ id: 1 });
      expect(service.canActOn(member, member)).toBe(false);
    });

    it('should return true for SUPER_ADMIN acting on any other member', () => {
      const actor = makeMember({ id: 1, role: Role.SUPER_ADMIN });
      const target = makeMember({ id: 2, role: Role.ADMIN });
      expect(service.canActOn(actor, target)).toBe(true);
    });

    it('should return true for ADMIN acting on MEMBER', () => {
      const actor = makeMember({ id: 1, role: Role.ADMIN });
      const target = makeMember({ id: 2, role: Role.MEMBER });
      expect(service.canActOn(actor, target)).toBe(true);
    });

    it('should return false for ADMIN acting on another ADMIN', () => {
      const actor = makeMember({ id: 1, role: Role.ADMIN });
      const target = makeMember({ id: 2, role: Role.ADMIN });
      expect(service.canActOn(actor, target)).toBe(false);
    });

    it('should return false for MEMBER acting on anyone', () => {
      const actor = makeMember({ id: 1, role: Role.MEMBER });
      const target = makeMember({ id: 2, role: Role.MEMBER });
      expect(service.canActOn(actor, target)).toBe(false);
    });
  });

  describe('addMember', () => {
    const requesting = makeMember({
      id: 1,
      role: Role.ADMIN,
      permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
    });

    it('should create a new member with default MEMBER role', async () => {
      mockUserService.findOne.mockResolvedValue({ id: 2 });
      mockRepo.findOne.mockResolvedValue(null);
      const newMember = makeMember({ id: 20, userId: 2 });
      mockRepo.create.mockReturnValue(newMember);
      mockRepo.save.mockResolvedValue(newMember);

      const result = await service.addMember(5, { userId: 2 }, requesting);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: Role.MEMBER,
          permissions: DEFAULT_PERMISSIONS[Role.MEMBER],
        }),
      );
      expect(result).toEqual(newMember);
    });

    it('should reactivate a previously left member', async () => {
      const leftMember = makeMember({ leftAt: new Date(), userId: 2 });
      mockUserService.findOne.mockResolvedValue({ id: 2 });
      mockRepo.findOne.mockResolvedValue(leftMember);
      mockRepo.save.mockResolvedValue({ ...leftMember, leftAt: null });

      const result = await service.addMember(5, { userId: 2 }, requesting);

      expect(result.leftAt).toBeNull();
    });

    it('should throw MemberBannedError when target is banned', async () => {
      mockUserService.findOne.mockResolvedValue({ id: 2 });
      mockRepo.findOne.mockResolvedValue(makeMember({ bannedAt: new Date() }));

      await expect(
        service.addMember(5, { userId: 2 }, requesting),
      ).rejects.toThrow(MemberBannedError);
    });

    it('should throw AlreadyMemberError when already an active member', async () => {
      mockUserService.findOne.mockResolvedValue({ id: 2 });
      mockRepo.findOne.mockResolvedValue(makeMember({ userId: 2 }));

      await expect(
        service.addMember(5, { userId: 2 }, requesting),
      ).rejects.toThrow(AlreadyMemberError);
    });

    it('should throw UserNotFoundError when target user does not exist', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      await expect(
        service.addMember(5, { userId: 99 }, requesting),
      ).rejects.toThrow(UserNotFoundError);
    });

    it('should throw InsufficientPermissionsError when ADMIN tries to assign ADMIN role', async () => {
      mockUserService.findOne.mockResolvedValue({ id: 2 });
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addMember(5, { userId: 2, role: Role.ADMIN }, requesting),
      ).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should allow SUPER_ADMIN to assign ADMIN role', async () => {
      const superAdmin = makeMember({ id: 1, role: Role.SUPER_ADMIN });
      mockUserService.findOne.mockResolvedValue({ id: 2 });
      mockRepo.findOne.mockResolvedValue(null);
      const newAdmin = makeMember({ id: 20, role: Role.ADMIN });
      mockRepo.create.mockReturnValue(newAdmin);
      mockRepo.save.mockResolvedValue(newAdmin);

      const result = await service.addMember(
        5,
        { userId: 2, role: Role.ADMIN },
        superAdmin,
      );
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  describe('ban', () => {
    it('should set bannedAt when actor has permission and higher role', async () => {
      const actor = makeMember({
        id: 1,
        role: Role.ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
      });
      const target = makeMember({ id: 2, role: Role.MEMBER });
      mockRepo.save.mockResolvedValue({
        ...target,
        bannedAt: expect.any(Date) as unknown,
      });

      await service.ban(target, actor);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ bannedAt: expect.any(Date) as unknown }),
      );
    });

    it('should throw when actor lacks BAN_MEMBERS permission', async () => {
      const actor = makeMember({ id: 1, role: Role.MEMBER, permissions: [] });
      const target = makeMember({ id: 2 });

      await expect(service.ban(target, actor)).rejects.toThrow(
        InsufficientPermissionsError,
      );
    });

    it('should throw when ADMIN tries to ban another ADMIN', async () => {
      const actor = makeMember({
        id: 1,
        role: Role.ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
      });
      const target = makeMember({ id: 2, role: Role.ADMIN });

      await expect(service.ban(target, actor)).rejects.toThrow(
        InsufficientPermissionsError,
      );
    });

    it('should be a no-op when target is already banned', async () => {
      const actor = makeMember({ id: 1, role: Role.SUPER_ADMIN });
      const target = makeMember({ id: 2, bannedAt: new Date() });

      await service.ban(target, actor);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('leave', () => {
    it('should set leftAt to current date', async () => {
      const member = makeMember();
      mockRepo.save.mockResolvedValue({
        ...member,
        leftAt: expect.any(Date) as unknown,
      });

      await service.leave(member);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ leftAt: expect.any(Date) as unknown }),
      );
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions when actor has EDIT_PERMISSIONS and higher role', async () => {
      const actor = makeMember({ id: 1, role: Role.SUPER_ADMIN });
      const target = makeMember({ id: 2, role: Role.MEMBER });
      const dto = {
        permissions: [Permission.SEND_MESSAGES, Permission.ADD_MEMBERS],
      };
      mockRepo.save.mockResolvedValue({ ...target, ...dto });

      const result = await service.updatePermissions(target, dto, actor);
      expect(result.permissions).toEqual(dto.permissions);
    });

    it('should throw when actor lacks EDIT_PERMISSIONS permission', async () => {
      const actor = makeMember({ id: 1, role: Role.ADMIN, permissions: [] });
      const target = makeMember({ id: 2, role: Role.MEMBER });

      await expect(
        service.updatePermissions(target, { permissions: [] }, actor),
      ).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should throw when ADMIN tries to edit another ADMIN permissions', async () => {
      const actor = makeMember({
        id: 1,
        role: Role.ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
      });
      const target = makeMember({ id: 2, role: Role.ADMIN });

      await expect(
        service.updatePermissions(target, { permissions: [] }, actor),
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('updateRole', () => {
    it('should update role and reset permissions to defaults', async () => {
      const actor = makeMember({ id: 1, role: Role.SUPER_ADMIN });
      const target = makeMember({ id: 2, role: Role.MEMBER });
      mockRepo.save.mockResolvedValue({
        ...target,
        role: Role.ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
      });

      const result = await service.updateRole(
        target,
        { role: Role.ADMIN },
        actor,
      );
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should throw when ADMIN tries to promote someone to ADMIN', async () => {
      const actor = makeMember({
        id: 1,
        role: Role.ADMIN,
        permissions: DEFAULT_PERMISSIONS[Role.ADMIN],
      });
      const target = makeMember({ id: 2, role: Role.MEMBER });

      await expect(
        service.updateRole(target, { role: Role.ADMIN }, actor),
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('getTargetMember', () => {
    it('should return the member when found in the correct chat', async () => {
      const member = makeMember({ id: 10, chatId: 5 });
      mockRepo.findOne.mockResolvedValue(member);

      const result = await service.getTargetMember(5, 10);
      expect(result).toEqual(member);
    });

    it('should throw MemberNotFoundError when member is from a different chat', async () => {
      const member = makeMember({ id: 10, chatId: 99 });
      mockRepo.findOne.mockResolvedValue(member);

      await expect(service.getTargetMember(5, 10)).rejects.toThrow(
        MemberNotFoundError,
      );
    });
  });
});
