import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../../../../src/chat/application/chat.service';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../../../src/chat/domain/chat.repository.interface';
import { ChatDomain } from '../../../../src/chat/domain/chat.domain';
import { ChatNotFoundError, ChatTagTakenError } from '../../../../src/chat/domain/chat.errors';
import { InsufficientPermissionsError } from '../../../../src/member/domain/member.errors';
import { MemberService } from '../../../../src/member/application/member.service';
import { MemberDomain } from '../../../../src/member/domain/member.domain';
import { DEFAULT_PERMISSIONS, Role } from '../../../../src/member/domain/member.enum';

const mockChatRepo: Partial<IChatRepository> = {
  findByTag: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
  list: jest.fn(),
};

const mockMemberService = { createOwner: jest.fn() };

const mockChat = new ChatDomain(1, 'Test Chat', 'testchat', null);

const makeMember = (role = Role.ADMIN) =>
  new MemberDomain(10, 1, 1, role, DEFAULT_PERMISSIONS[role], null, null);

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: CHAT_REPOSITORY, useValue: mockChatRepo },
        { provide: MemberService, useValue: mockMemberService },
      ],
    }).compile();

    service = module.get(ChatService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a chat and assign owner membership', async () => {
      (mockChatRepo.findByTag as jest.Mock).mockResolvedValue(null);
      (mockChatRepo.save as jest.Mock).mockResolvedValue(mockChat);
      mockMemberService.createOwner.mockResolvedValue({});

      const result = await service.create(
        { name: 'Test Chat', tag: 'testchat' },
        1,
      );

      expect(mockChatRepo.save).toHaveBeenCalled();
      expect(mockMemberService.createOwner).toHaveBeenCalledWith(mockChat.id, 1);
      expect(result).toEqual(mockChat);
    });

    it('should throw ChatTagTakenError when tag is already used', async () => {
      (mockChatRepo.findByTag as jest.Mock).mockResolvedValue(mockChat);

      await expect(
        service.create({ name: 'New', tag: 'testchat' }, 1),
      ).rejects.toThrow(ChatTagTakenError);
    });
  });

  describe('findById', () => {
    it('should return chat when found', async () => {
      (mockChatRepo.findById as jest.Mock).mockResolvedValue(mockChat);
      expect(await service.findById(1)).toEqual(mockChat);
    });

    it('should throw ChatNotFoundError when not found', async () => {
      (mockChatRepo.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(ChatNotFoundError);
    });
  });

  describe('update', () => {
    it('should update chat fields when member has EDIT_CHAT_INFO permission', async () => {
      const member = makeMember();
      const chat = new ChatDomain(1, 'Test Chat', 'testchat', null);
      const updated = new ChatDomain(1, 'Updated', 'testchat', null);
      (mockChatRepo.save as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(chat, { name: 'Updated' }, member);

      expect(result.name).toBe('Updated');
      expect(mockChatRepo.save).toHaveBeenCalled();
    });

    it('should throw InsufficientPermissionsError when member lacks permission', async () => {
      const member = makeMember(Role.MEMBER);

      await expect(
        service.update(mockChat, { name: 'x' }, member),
      ).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('list', () => {
    it('should return paginated chats with total count', async () => {
      (mockChatRepo.list as jest.Mock).mockResolvedValue({
        items: [mockChat],
        total: 1,
      });

      const result = await service.list({ page: 1, limit: 20 });

      expect(result.items).toEqual([mockChat]);
      expect(result.total).toBe(1);
      expect(mockChatRepo.list).toHaveBeenCalledWith(0, 20);
    });

    it('should calculate correct skip for page 2', async () => {
      (mockChatRepo.list as jest.Mock).mockResolvedValue({
        items: [],
        total: 25,
      });

      await service.list({ page: 2, limit: 10 });

      expect(mockChatRepo.list).toHaveBeenCalledWith(10, 10);
    });
  });
});