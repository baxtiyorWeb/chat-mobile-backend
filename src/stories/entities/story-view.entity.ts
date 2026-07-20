import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('story_views')
@Unique(['storyId', 'viewerId'])
export class StoryView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  storyId: string;

  @Index()
  @Column()
  viewerId: string;

  @CreateDateColumn()
  createdAt: Date;
}
