import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './infrastructure/user.entity';
import { UserRepository } from './infrastructure/user.repository';
import { USER_REPOSITORY } from './domain/user.repository.interface';
import { UserService } from './application/user.service';
import { UserController } from './presentation/user.controller';
import { JwtAuthGuard } from '../shared/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepository },
    UserService,
    JwtAuthGuard,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
