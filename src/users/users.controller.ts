import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }

  @Get('search')
  async searchUsers(@Query('q') query: string, @Request() req) {
    const searchString = query || '';
    return this.usersService.searchUsers(searchString, req.user.id);
  }

  @Get()
  async getAllUsers(@Request() req) {
    return this.usersService.getAllUsers(req.user.id);
  }
}
