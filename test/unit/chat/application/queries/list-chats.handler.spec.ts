import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { ListChatsHandler } from '../../../../../src/chat/application/queries/list-chats.handler';
import { ListChatsQuery } from '../../../../../src/chat/application/queries/list-chats.query';
import { CHAT_REPOSITORY } from '../../../../../src/chat/domain/chat.repository.interface';
import { ChatDomain } from '../../../../../src/chat/domain/chat.domain';

describe('ListChatsHandler (integration)', () => {
  let handler: ListChatsHandler;
  const mockRepo = { list: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        ListChatsHandler,
        { provide: CHAT_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    handler = module.get(ListChatsHandler);
    jest.clearAllMocks();
  });

  it('should return mapped ChatReadModels with pagination', async () => {
    mockRepo.list.mockResolvedValue({
      items: [
        new ChatDomain(1, 'Alpha', 'alpha', 'desc'),
        new ChatDomain(2, 'Beta', 'beta', null),
      ],
      total: 2,
    });

    const result = await handler.execute(new ListChatsQuery(1, 20));

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      id: 1,
      name: 'Alpha',
      tag: 'alpha',
      description: 'desc',
    });
    expect(mockRepo.list).toHaveBeenCalledWith(0, 20);
  });

  it('should apply correct skip for page 2', async () => {
    mockRepo.list.mockResolvedValue({ items: [], total: 25 });

    await handler.execute(new ListChatsQuery(2, 10));

    expect(mockRepo.list).toHaveBeenCalledWith(10, 10);
  });
});
