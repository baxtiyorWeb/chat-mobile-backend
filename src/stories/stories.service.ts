import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { Story } from './entities/story.entity';
import { StoryView } from './entities/story-view.entity';
import { User } from '../users/entities/user.entity';
import { ContactsService } from '../contacts/contacts.service';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export interface StoryItem {
  id: string;
  text: string;
  backgroundColor: string;
  createdAt: string;
  expiresAt: string;
}

export interface StoryGroup {
  user: { id: string; username: string; avatar: string };
  stories: StoryItem[];
  hasUnseen: boolean;
  isMine: boolean;
}

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
    @InjectRepository(StoryView)
    private storyViewRepository: Repository<StoryView>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private contactsService: ContactsService,
  ) {}

  async createStory(
    userId: string,
    text: string,
    backgroundColor?: string,
  ): Promise<StoryItem> {
    const now = new Date();
    const story = this.storyRepository.create({
      userId,
      text: text.trim(),
      backgroundColor: backgroundColor || '#7c3aed',
      expiresAt: new Date(now.getTime() + STORY_TTL_MS),
    });
    const saved = await this.storyRepository.save(story);
    return this.toItem(saved);
  }

  async getStoryFeed(currentUserId: string): Promise<StoryGroup[]> {
    const contacts = await this.contactsService.listContacts(currentUserId);
    const authorIds = [currentUserId, ...contacts.map((c) => c.id)];

    const stories = await this.storyRepository.find({
      where: {
        userId: In(authorIds),
        expiresAt: MoreThan(new Date()),
      },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    if (stories.length === 0) {
      return [];
    }

    const seen = await this.storyViewRepository.find({
      where: {
        viewerId: currentUserId,
        storyId: In(stories.map((s) => s.id)),
      },
    });
    const seenIds = new Set(seen.map((v) => v.storyId));

    const groups = new Map<string, StoryGroup>();
    for (const story of stories) {
      if (!story.user) continue;
      let group = groups.get(story.userId);
      if (!group) {
        group = {
          user: {
            id: story.user.id,
            username: story.user.username,
            avatar: story.user.avatar,
          },
          stories: [],
          hasUnseen: false,
          isMine: story.userId === currentUserId,
        };
        groups.set(story.userId, group);
      }
      group.stories.push(this.toItem(story));
      if (!seenIds.has(story.id) && story.userId !== currentUserId) {
        group.hasUnseen = true;
      }
    }

    // Own stories first, then groups with unseen stories, then the rest.
    return Array.from(groups.values()).sort((a, b) => {
      if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return 0;
    });
  }

  async markViewed(
    viewerId: string,
    storyId: string,
  ): Promise<{ success: boolean }> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });
    if (!story) {
      throw new NotFoundException('Story not found');
    }
    const existing = await this.storyViewRepository.findOne({
      where: { storyId, viewerId },
    });
    if (!existing) {
      const view = this.storyViewRepository.create({ storyId, viewerId });
      await this.storyViewRepository.save(view);
    }
    return { success: true };
  }

  async deleteStory(
    userId: string,
    storyId: string,
  ): Promise<{ success: boolean }> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });
    if (!story) {
      throw new NotFoundException('Story not found');
    }
    if (story.userId !== userId) {
      throw new ForbiddenException('You can only delete your own story');
    }
    await this.storyRepository.delete({ id: storyId });
    return { success: true };
  }

  private toItem(story: Story): StoryItem {
    return {
      id: story.id,
      text: story.text,
      backgroundColor: story.backgroundColor,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
    };
  }
}
