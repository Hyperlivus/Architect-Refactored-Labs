import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../shared/jwt-auth.guard';
import { CurrentUser } from '../../shared/current-user.decorator';
import { GetCurrentUserQuery } from '../application/queries/get-current-user.query';

@Controller('user')
export class UserController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() userId: number) {
    return this.queryBus.execute(new GetCurrentUserQuery(userId));
  }
}
