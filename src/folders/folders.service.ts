import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatFolder } from './entities/folder.entity';
import { FolderMember } from './entities/folder-member.entity';

export interface FolderSummary {
  id: string;
  name: string;
  position: number;
  memberIds: string[];
}

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(ChatFolder)
    private folderRepository: Repository<ChatFolder>,
    @InjectRepository(FolderMember)
    private memberRepository: Repository<FolderMember>,
  ) {}

  async listFolders(ownerId: string): Promise<FolderSummary[]> {
    const folders = await this.folderRepository.find({
      where: { ownerId },
      relations: { members: true },
      order: { position: 'ASC', createdAt: 'ASC' },
    });

    return folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      position: folder.position,
      memberIds: (folder.members || []).map((m) => m.memberId),
    }));
  }

  async createFolder(ownerId: string, name: string): Promise<FolderSummary> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Folder name is required');
    }

    const count = await this.folderRepository.count({ where: { ownerId } });
    const folder = this.folderRepository.create({
      ownerId,
      name: trimmed,
      position: count,
    });
    const saved = await this.folderRepository.save(folder);

    return {
      id: saved.id,
      name: saved.name,
      position: saved.position,
      memberIds: [],
    };
  }

  private async getOwnedFolder(
    ownerId: string,
    folderId: string,
  ): Promise<ChatFolder> {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
    });
    if (!folder || folder.ownerId !== ownerId) {
      throw new NotFoundException('Folder not found');
    }
    return folder;
  }

  async renameFolder(
    ownerId: string,
    folderId: string,
    name: string,
  ): Promise<FolderSummary> {
    const folder = await this.getOwnedFolder(ownerId, folderId);
    folder.name = name.trim();
    const saved = await this.folderRepository.save(folder);
    const members = await this.memberRepository.find({
      where: { folderId: saved.id },
    });
    return {
      id: saved.id,
      name: saved.name,
      position: saved.position,
      memberIds: members.map((m) => m.memberId),
    };
  }

  async deleteFolder(
    ownerId: string,
    folderId: string,
  ): Promise<{ success: boolean }> {
    await this.getOwnedFolder(ownerId, folderId);
    await this.folderRepository.delete({ id: folderId });
    return { success: true };
  }

  async addMember(
    ownerId: string,
    folderId: string,
    memberId: string,
  ): Promise<{ success: boolean }> {
    await this.getOwnedFolder(ownerId, folderId);
    const existing = await this.memberRepository.findOne({
      where: { folderId, memberId },
    });
    if (!existing) {
      const member = this.memberRepository.create({ folderId, memberId });
      await this.memberRepository.save(member);
    }
    return { success: true };
  }

  async removeMember(
    ownerId: string,
    folderId: string,
    memberId: string,
  ): Promise<{ success: boolean }> {
    await this.getOwnedFolder(ownerId, folderId);
    await this.memberRepository.delete({ folderId, memberId });
    return { success: true };
  }
}
