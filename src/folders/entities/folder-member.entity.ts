import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { ChatFolder } from './folder.entity';

@Entity('chat_folder_members')
@Unique(['folderId', 'memberId'])
export class FolderMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  folderId: string;

  @ManyToOne(() => ChatFolder, (folder) => folder.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'folderId' })
  folder: ChatFolder;

  @Column()
  memberId: string;
}
