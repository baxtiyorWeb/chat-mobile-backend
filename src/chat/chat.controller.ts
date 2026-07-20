import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('recent')
  async getRecentChats(@Request() req) {
    return this.chatService.getRecentChats(req.user.id);
  }

  @Get('messages/:otherUserId')
  async getConversation(@Param('otherUserId') otherUserId: string, @Request() req) {
    return this.chatService.getConversation(req.user.id, otherUserId);
  }
}
