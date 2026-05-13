import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { GetCurrentUserHandler } from '../../../../../src/user/application/queries/get-current-user.handler';
import { GetCurrentUserQuery } from '../../../../../src/user/application/queries/get-current-user.query';
import { USER_REPOSITORY } from '../../../../../src/user/domain/user.repository.interface';
import { UserDomain } from '../../../../../src/user/domain/user.domain';
import { UserNotFoundError } from '../../../../../src/user/domain/user.errors';

describe('GetCurrentUserHandler (integration)', () => {
  let handler: GetCurrentUserHandler;
  const mockRepo = { findById: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        GetCurrentUserHandler,
        { provide: USER_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    handler = module.get(GetCurrentUserHandler);
    jest.clearAllMocks();
  });

  it('should return UserReadModel without sensitive fields', async () => {
    mockRepo.findById.mockResolvedValue(
      new UserDomain(1, 'alice@test.com', 'Alice', 'alice', 'hash', true, null),
    );

    const result = await handler.execute(new GetCurrentUserQuery(1));

    expect(result).toEqual({
      id: 1,
      email: 'alice@test.com',
      nickname: 'Alice',
      tag: 'alice',
      emailVerified: true,
    });
    expect(
      (result as unknown as Record<string, unknown>).passwordHash,
    ).toBeUndefined();
    expect((result as unknown as Record<string, unknown>).otp).toBeUndefined();
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(handler.execute(new GetCurrentUserQuery(999))).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
