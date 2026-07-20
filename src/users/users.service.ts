import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Like } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async searchUsers(query: string, currentUserId: string) {
    return this.userRepository.find({
      where: {
        id: Not(currentUserId),
        username: Like(`%${query}%`),
      },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
      take: 20,
    });
  }

  async getAllUsers(currentUserId: string) {
    return this.userRepository.find({
      where: {
        id: Not(currentUserId),
      },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
      order: {
        username: 'ASC',
      },
      take: 50,
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
