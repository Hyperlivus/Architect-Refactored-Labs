import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './infrastructure/member.entity';
import { MemberRepository } from './infrastructure/member.repository';
import { MEMBER_REPOSITORY } from './domain/member.repository.interface';
import { MemberService } from './application/member.service';
import { MemberGuard } from './presentation/member.guard';
import { MemberController } from './presentation/member.controller';
import { UserModule } from '../user/user.module';
import { AddMemberHandler } from './application/commands/add-member.handler';
import { BanMemberHandler } from './application/commands/ban-member.handler';
import { UnbanMemberHandler } from './application/commands/unban-member.handler';
import { LeaveChatHandler } from './application/commands/leave-chat.handler';
import { UpdateMemberPermissionsHandler } from './application/commands/update-member-permissions.handler';
import { UpdateMemberRoleHandler } from './application/commands/update-member-role.handler';

const CommandHandlers = [
  AddMemberHandler,
  BanMemberHandler,
  UnbanMemberHandler,
  LeaveChatHandler,
  UpdateMemberPermissionsHandler,
  UpdateMemberRoleHandler,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([Member]), UserModule],
  providers: [
    { provide: MEMBER_REPOSITORY, useClass: MemberRepository },
    MemberService,
    MemberGuard,
    ...CommandHandlers,
  ],
  controllers: [MemberController],
  exports: [MemberService, MemberGuard],
})
export class MemberModule {}
