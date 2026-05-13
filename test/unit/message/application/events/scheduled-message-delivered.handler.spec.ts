import { ScheduledMessageDeliveredHandler } from '../../../../../src/message/application/events/scheduled-message-delivered.handler';
import { ScheduledMessageDeliveredEvent } from '../../../../../src/message/application/events/scheduled-message-delivered.event';
import { MemberDomain } from '../../../../../src/member/domain/member.domain';
import { UserDomain } from '../../../../../src/user/domain/user.domain';
import {
  DEFAULT_PERMISSIONS,
  Role,
} from '../../../../../src/member/domain/member.enum';
import type { MemberService } from '../../../../../src/member/application/member.service';
import type { UserService } from '../../../../../src/user/application/user.service';
import type { IMailService } from '../../../../../src/mail/mail.service.interface';

const mockMemberService = {
  findById: jest.fn(),
} as unknown as MemberService;

const mockUserService = {
  findById: jest.fn(),
} as unknown as UserService;

const mockMailService: jest.Mocked<IMailService> = {
  send: jest.fn(),
};

const event = new ScheduledMessageDeliveredEvent(1, 5, 10, 'Hello', new Date());

describe('ScheduledMessageDeliveredHandler', () => {
  let handler: ScheduledMessageDeliveredHandler;

  beforeEach(() => {
    handler = new ScheduledMessageDeliveredHandler(
      mockMemberService,
      mockUserService,
      mockMailService,
    );
    jest.clearAllMocks();
  });

  it('should send email notification when member and user exist', async () => {
    (mockMemberService.findById as jest.Mock).mockResolvedValue(
      new MemberDomain(
        10,
        42,
        5,
        Role.MEMBER,
        DEFAULT_PERMISSIONS[Role.MEMBER],
        null,
        null,
      ),
    );
    (mockUserService.findById as jest.Mock).mockResolvedValue(
      new UserDomain(
        42,
        'sender@test.com',
        'Sender',
        'sender',
        'hash',
        true,
        null,
      ),
    );
    mockMailService.send.mockResolvedValue(undefined);

    await handler.handle(event);

    expect(mockMailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'sender@test.com' }),
    );
  });

  it('should not throw when member is not found', async () => {
    (mockMemberService.findById as jest.Mock).mockResolvedValue(null);

    await expect(handler.handle(event)).resolves.not.toThrow();
    expect(mockMailService.send).not.toHaveBeenCalled();
  });

  it('should not throw when mail service fails', async () => {
    (mockMemberService.findById as jest.Mock).mockResolvedValue(
      new MemberDomain(
        10,
        42,
        5,
        Role.MEMBER,
        DEFAULT_PERMISSIONS[Role.MEMBER],
        null,
        null,
      ),
    );
    (mockUserService.findById as jest.Mock).mockResolvedValue(
      new UserDomain(
        42,
        'sender@test.com',
        'Sender',
        'sender',
        'hash',
        true,
        null,
      ),
    );
    mockMailService.send.mockRejectedValue(new Error('SMTP timeout'));

    await expect(handler.handle(event)).resolves.not.toThrow();
  });

  it('should not throw when user is not found', async () => {
    (mockMemberService.findById as jest.Mock).mockResolvedValue(
      new MemberDomain(
        10,
        42,
        5,
        Role.MEMBER,
        DEFAULT_PERMISSIONS[Role.MEMBER],
        null,
        null,
      ),
    );
    (mockUserService.findById as jest.Mock).mockResolvedValue(null);

    await expect(handler.handle(event)).resolves.not.toThrow();
    expect(mockMailService.send).not.toHaveBeenCalled();
  });
});
