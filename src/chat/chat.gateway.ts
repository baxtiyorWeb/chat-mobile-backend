import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      let token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string) ||
        client.handshake.headers?.authorization;
      
      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      if (!token) {
        client.disconnect();
        return;
      }

      const user = await this.authService.validateToken(token);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      await client.join(user.id);
      console.log(`Client ${client.id} authenticated as User: ${user.username} (${user.id})`);
    } catch (error) {
      console.error(`Error authenticating socket client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      console.log(`User ${user.username} (${user.id}) disconnected`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; content: string; replyToId?: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const { receiverId, content, replyToId } = data;
    if (!receiverId || !content || typeof content !== 'string' || content.trim() === '') {
      return;
    }

    const savedMessage = await this.chatService.saveMessage(user.id, receiverId, content.trim(), replyToId);

    this.server.to(user.id).emit('message', savedMessage);
    this.server.to(receiverId).emit('message', savedMessage);
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string; receiverId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const { messageId, content, receiverId } = data;
    if (!messageId || !content || typeof content !== 'string' || content.trim() === '') {
      return;
    }

    const updated = await this.chatService.editMessage(user.id, messageId, content.trim());
    if (updated) {
      this.server.to(user.id).emit('messageEdited', updated);
      if (receiverId) {
        this.server.to(receiverId).emit('messageEdited', updated);
      }
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; receiverId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const { messageId, receiverId } = data;
    if (!messageId) return;

    const deleted = await this.chatService.deleteMessage(user.id, messageId);
    if (deleted) {
      const payload = { messageId, senderId: user.id, receiverId };
      this.server.to(user.id).emit('messageDeleted', payload);
      if (receiverId) {
        this.server.to(receiverId).emit('messageDeleted', payload);
      }
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const { senderId } = data;
    if (!senderId) return;

    await this.chatService.markAsRead(user.id, senderId);

    const payload = { readerId: user.id, senderId };
    this.server.to(user.id).emit('messagesRead', payload);
    this.server.to(senderId).emit('messagesRead', payload);
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; isTyping: boolean },
  ) {
    const user = client.data.user;
    if (!user) return;

    const { receiverId, isTyping } = data;
    if (!receiverId) return;

    client.to(receiverId).emit('typing', {
      senderId: user.id,
      isTyping: !!isTyping,
    });
  }
}
