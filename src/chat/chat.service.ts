import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async saveMessage(senderId: string, receiverId: string, content: string, replyToId?: string) {
    const message = this.messageRepository.create({
      senderId,
      receiverId,
      content,
      replyToId: replyToId || null,
      isRead: false,
      isEdited: false,
    });

    const saved = await this.messageRepository.save(message);

    return this.messageRepository.findOne({
      where: { id: saved.id },
      relations: {
        sender: true,
        receiver: true,
        replyTo: {
          sender: true,
        },
      },
    });
  }

  async editMessage(userId: string, messageId: string, content: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: {
        sender: true,
        receiver: true,
        replyTo: {
          sender: true,
        },
      },
    });

    if (!message || message.senderId !== userId) {
      return null;
    }

    message.content = content;
    message.isEdited = true;
    return this.messageRepository.save(message);
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message || message.senderId !== userId) {
      return null;
    }

    const copy = { ...message };
    await this.messageRepository.remove(message);
    return copy;
  }

  async markAsRead(readerId: string, senderId: string) {
    await this.messageRepository.update(
      { senderId: senderId, receiverId: readerId, isRead: false },
      { isRead: true },
    );
    return true;
  }

  async getConversation(userId1: string, userId2: string) {
    return this.messageRepository.find({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      relations: {
        sender: true,
        receiver: true,
        replyTo: {
          sender: true,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async getRecentChats(currentUserId: string) {
    const messages = await this.messageRepository.find({
      where: [
        { senderId: currentUserId },
        { receiverId: currentUserId },
      ],
      relations: { sender: true, receiver: true },
      order: {
        createdAt: 'DESC',
      },
    });

    const recentConversations: any[] = [];
    const seenUserIds = new Set<string>();

    for (const msg of messages) {
      const otherUser = msg.senderId === currentUserId ? msg.receiver : msg.sender;
      if (otherUser && !seenUserIds.has(otherUser.id)) {
        seenUserIds.add(otherUser.id);

        const unreadCount = await this.messageRepository.count({
          where: {
            senderId: otherUser.id,
            receiverId: currentUserId,
            isRead: false,
          },
        });

        recentConversations.push({
          user: {
            id: otherUser.id,
            username: otherUser.username,
            avatar: otherUser.avatar,
          },
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt.toISOString(),
            senderId: msg.senderId,
            isRead: msg.isRead,
          },
          unreadCount,
        });
      }
    }

    return recentConversations;
  }
}
