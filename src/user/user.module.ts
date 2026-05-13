import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './infrastructure/user.entity';
import { UserRepository } from './infrastructure/user.repository';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { UserService } from './application/user.service';
import { UserController } from './presentation/user.controller';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';
import { GetCurrentUserHandler } from './application/queries/get-current-user.handler';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([User])],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepository },
    UserService,
    JwtAuthGuard,
    GetCurrentUserHandler,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
