import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/story.dto';

interface AuthedRequest {
  user: { id: string };
}

@Controller('stories')
@UseGuards(AuthGuard('jwt'))
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Get()
  async feed(@Request() req: AuthedRequest) {
    return this.storiesService.getStoryFeed(req.user.id);
  }

  @Post()
  async create(@Body() dto: CreateStoryDto, @Request() req: AuthedRequest) {
    return this.storiesService.createStory(
      req.user.id,
      dto.text,
      dto.backgroundColor,
    );
  }

  @Post(':id/view')
  async view(@Param('id') id: string, @Request() req: AuthedRequest) {
    return this.storiesService.markViewed(req.user.id, id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: AuthedRequest) {
    return this.storiesService.deleteStory(req.user.id, id);
  }
}
