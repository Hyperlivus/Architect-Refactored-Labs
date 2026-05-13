import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { ListMessagesHandler } from '../../../../../src/message/application/queries/list-messages.handler';
import { ListMessagesQuery } from '../../../../../src/message/application/queries/list-messages.query';
import { MESSAGE_REPOSITORY } from '../../../../../src/message/domain/message.repository.interface';
import { MessageDomain } from '../../../../../src/message/domain/message.domain';

describe('ListMessagesHandler (integration)', () => {
  let handler: ListMessagesHandler;
  const mockRepo = { list: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        ListMessagesHandler,
        { provide: MESSAGE_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    handler = module.get(ListMessagesHandler);
    jest.clearAllMocks();
  });

  it('should return mapped MessageReadModels', async () => {
    const now = new Date();
    mockRepo.list.mockResolvedValue({
      items: [new MessageDomain(1, 'Hello', 5, 10, now, null)],
      total: 1,
    });

    const result = await handler.execute(new ListMessagesQuery(5, 1, 20));

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: 1,
      content: 'Hello',
      chatId: 5,
      memberId: 10,
      createdAt: now,
    });
    expect(mockRepo.list).toHaveBeenCalledWith(5, 0, 20);
  });

  it('should exclude soft-deleted messages (repository handles filter)', async () => {
    mockRepo.list.mockResolvedValue({ items: [], total: 0 });

    const result = await handler.execute(new ListMessagesQuery(5, 1, 20));

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
