import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { User } from '../users/entities/user.entity';

export interface ContactSummary {
  id: string;
  username: string;
  avatar: string;
  createdAt: string;
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async listContacts(ownerId: string): Promise<ContactSummary[]> {
    const contacts = await this.contactRepository.find({
      where: { ownerId },
      relations: { contact: true },
      order: { createdAt: 'DESC' },
    });

    return contacts
      .filter((c) => c.contact)
      .map((c) => ({
        id: c.contact.id,
        username: c.contact.username,
        avatar: c.contact.avatar,
        createdAt: c.createdAt.toISOString(),
      }));
  }

  async addContact(
    ownerId: string,
    contactId: string,
  ): Promise<ContactSummary> {
    if (ownerId === contactId) {
      throw new BadRequestException('You cannot add yourself as a contact');
    }

    const target = await this.userRepository.findOne({
      where: { id: contactId },
      select: { id: true, username: true, avatar: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.contactRepository.findOne({
      where: { ownerId, contactId },
    });
    if (!existing) {
      const contact = this.contactRepository.create({ ownerId, contactId });
      await this.contactRepository.save(contact);
    }

    return {
      id: target.id,
      username: target.username,
      avatar: target.avatar,
      createdAt: new Date().toISOString(),
    };
  }

  async removeContact(
    ownerId: string,
    contactId: string,
  ): Promise<{ success: boolean }> {
    await this.contactRepository.delete({ ownerId, contactId });
    return { success: true };
  }
}
