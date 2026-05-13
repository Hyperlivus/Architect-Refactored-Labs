import { UpdateChatHandler } from '../../../../../src/chat/application/commands/update-chat.handler';
import { UpdateChatCommand } from '../../../../../src/chat/application/commands/update-chat.command';
import { ChatDomain } from '../../../../../src/chat/domain/chat.domain';
import { ChatNotFoundError } from '../../../../../src/chat/domain/chat.errors';
import type { IChatRepository } from '../../../../../src/chat/domain/chat.repository.interface';

const mockRepo: jest.Mocked<IChatRepository> = {
  findById: jest.fn(),
  findByTag: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  list: jest.fn(),
};

describe('UpdateChatHandler', () => {
  let handler: UpdateChatHandler;

  beforeEach(() => {
    handler = new UpdateChatHandler(mockRepo);
    jest.clearAllMocks();
  });

  it('should update chat name and return read model', async () => {
    const chat = new ChatDomain(1, 'Old Name', 'testchat', null);
    mockRepo.findById.mockResolvedValue(chat);
    mockRepo.save.mockImplementation((c) => Promise.resolve(c));

    const result = await handler.execute(
      new UpdateChatCommand(1, 'New Name', undefined),
    );

    expect(result.name).toBe('New Name');
    expect(result.id).toBe(1);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw ChatNotFoundError when chat does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateChatCommand(99, 'Name', undefined)),
    ).rejects.toThrow(ChatNotFoundError);
  });

  it('should throw when domain validation fails (name too short)', async () => {
    const chat = new ChatDomain(1, 'Old Name', 'testchat', null);
    mockRepo.findById.mockResolvedValue(chat);

    await expect(
      handler.execute(new UpdateChatCommand(1, 'X', undefined)),
    ).rejects.toThrow();
  });
});
