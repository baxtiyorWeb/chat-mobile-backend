import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FoldersService } from './folders.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';

interface AuthedRequest {
  user: { id: string };
}

@Controller('folders')
@UseGuards(AuthGuard('jwt'))
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Get()
  async list(@Request() req: AuthedRequest) {
    return this.foldersService.listFolders(req.user.id);
  }

  @Post()
  async create(@Body() dto: CreateFolderDto, @Request() req: AuthedRequest) {
    return this.foldersService.createFolder(req.user.id, dto.name);
  }

  @Patch(':id')
  async rename(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @Request() req: AuthedRequest,
  ) {
    return this.foldersService.renameFolder(req.user.id, id, dto.name);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: AuthedRequest) {
    return this.foldersService.deleteFolder(req.user.id, id);
  }

  @Post(':id/members/:userId')
  async addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: AuthedRequest,
  ) {
    return this.foldersService.addMember(req.user.id, id, userId);
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: AuthedRequest,
  ) {
    return this.foldersService.removeMember(req.user.id, id, userId);
  }
}
