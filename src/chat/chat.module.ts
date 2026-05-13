import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './infrastructure/chat.entity';
import { ChatRepository } from './infrastructure/chat.repository';
import { CHAT_REPOSITORY } from './domain/chat.repository.interface';
import { ChatService } from './application/chat.service';
import { ChatController } from './presentation/chat.controller';
import { MemberModule } from '../member/member.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chat]), MemberModule, UserModule],
  providers: [
    { provide: CHAT_REPOSITORY, useClass: ChatRepository },
    ChatService,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
