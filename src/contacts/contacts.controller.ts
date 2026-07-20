import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContactsService } from './contacts.service';

interface AuthedRequest {
  user: { id: string };
}

@Controller('contacts')
@UseGuards(AuthGuard('jwt'))
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  async list(@Request() req: AuthedRequest) {
    return this.contactsService.listContacts(req.user.id);
  }

  @Post(':userId')
  async add(@Param('userId') userId: string, @Request() req: AuthedRequest) {
    return this.contactsService.addContact(req.user.id, userId);
  }

  @Delete(':userId')
  async remove(@Param('userId') userId: string, @Request() req: AuthedRequest) {
    return this.contactsService.removeContact(req.user.id, userId);
  }
}
