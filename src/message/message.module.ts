import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './infrastructure/message.entity';
import { MessageRepository } from './infrastructure/message.repository';
import { MESSAGE_REPOSITORY } from './domain/message.repository.interface';
import { MessageFactory } from './domain/message.factory';
import { MessageService } from './application/message.service';
import { MessageController } from './presentation/message.controller';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), MemberModule],
  providers: [
    { provide: MESSAGE_REPOSITORY, useClass: MessageRepository },
    MessageFactory,
    MessageService,
  ],
  controllers: [MessageController],
})
export class MessageModule {}
