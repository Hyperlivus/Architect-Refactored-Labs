import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { Chat } from './chat.entity';
import { ChatNotFoundError, ChatTagTakenError } from './chat.errors';
import { InsufficientPermissionsError } from '../member/member.errors';
import { MemberService } from '../member/member.service';
import { Permission, Role } from '../member/member.enum';
import type { Member } from '../member/member.entity';

const mockRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockMemberService = {
  createOwner: jest.fn(),
  hasPermission: jest.fn(),
};

const mockChat: Chat = { id: 1, name: 'Test Chat', tag: 'testchat', description: null };

const makeMember = (role = Role.ADMIN, permissions = [Permission.EDIT_CHAT_INFO]): Member => ({
  id: 10, userId: 1, chatId: 1, role, permissions, bannedAt: null, leftAt: null,
});

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(Chat), useValue: mockRepo },
        { provide: MemberService, useValue: mockMemberService },
      ],
    }).compile();

    service = module.get(ChatService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a chat and assign owner membership', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(mockChat);
      mockRepo.save.mockResolvedValue(mockChat);
      mockMemberService.createOwner.mockResolvedValue({});

      const result = await service.create({ name: 'Test Chat', tag: 'testchat' }, 1);

      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockMemberService.createOwner).toHaveBeenCalledWith(mockChat.id, 1);
      expect(result).toEqual(mockChat);
    });

    it('should throw ChatTagTakenError when tag is already used', async () => {
      mockRepo.findOne.mockResolvedValue(mockChat);

      await expect(service.create({ name: 'New', tag: 'testchat' }, 1)).rejects.toThrow(ChatTagTakenError);
    });
  });

  describe('findById', () => {
    it('should return chat when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockChat);
      expect(await service.findById(1)).toEqual(mockChat);
    });

    it('should throw ChatNotFoundError when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(ChatNotFoundError);
    });
  });

  describe('update', () => {
    it('should update chat fields when member has EDIT_CHAT_INFO permission', async () => {
      const member = makeMember();
      mockMemberService.hasPermission.mockReturnValue(true);
      mockRepo.save.mockResolvedValue({ ...mockChat, name: 'Updated' });

      const result = await service.update(mockChat, { name: 'Updated' }, member);

      expect(result.name).toBe('Updated');
    });

    it('should throw InsufficientPermissionsError when member lacks permission', async () => {
      const member = makeMember(Role.MEMBER, []);
      mockMemberService.hasPermission.mockReturnValue(false);

      await expect(service.update(mockChat, { name: 'x' }, member)).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('list', () => {
    it('should return paginated chats with total count', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockChat], 1]);

      const result = await service.list({ page: 1, limit: 20 });

      expect(result.items).toEqual([mockChat]);
      expect(result.total).toBe(1);
      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
    });

    it('should calculate correct skip for page 2', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 25]);

      await service.list({ page: 2, limit: 10 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
    });
  });
});
