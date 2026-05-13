import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MAIL_SERVICE } from '../../../mail/mail.service.interface';
import type { IMailService } from '../../../mail/mail.service.interface';
import { MemberService } from '../../../member/application/member.service';
import { UserService } from '../../../user/application/user.service';
import { ScheduledMessageDeliveredEvent } from './scheduled-message-delivered.event';

@EventsHandler(ScheduledMessageDeliveredEvent)
export class ScheduledMessageDeliveredHandler implements IEventHandler<ScheduledMessageDeliveredEvent> {
  private readonly logger = new Logger(ScheduledMessageDeliveredHandler.name);

  constructor(
    private readonly memberService: MemberService,
    private readonly userService: UserService,
    @Inject(MAIL_SERVICE) private readonly mailService: IMailService,
  ) {}

  async handle(event: ScheduledMessageDeliveredEvent): Promise<void> {
    try {
      const member = await this.memberService.findById(event.memberId);
      if (!member) return;

      const user = await this.userService.findById(member.userId);
      if (!user) return;

      await this.mailService.send({
        to: user.email,
        subject: 'Your scheduled message was delivered',
        html: `Your scheduled message in chat #${event.chatId} was delivered at ${event.deliveredAt.toLocaleString()}.`,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send delivery notification for message #${event.messageId}`,
        err,
      );
    }
  }
}
