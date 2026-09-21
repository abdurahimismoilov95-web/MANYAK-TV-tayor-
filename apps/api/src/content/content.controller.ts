import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto, UpdateContentDto, ContentFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all content with filters' })
  async findAll(@Query() filters: ContentFilterDto) {
    return this.contentService.findAll(filters);
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending content' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrending(@Query('limit') limit?: number) {
    return this.contentService.getTrending(limit);
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured content for hero section' })
  async getFeatured() {
    return this.contentService.getFeatured();
  }

  @Get('recent')
  @Public()
  @ApiOperation({ summary: 'Get recently added content' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecent(@Query('limit') limit?: number) {
    return this.contentService.getRecentlyAdded(limit);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search content' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.contentService.search(query, limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get content statistics (admin only)' })
  async getStats() {
    return this.contentService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get content by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contentService.findOne(id, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new content (admin only)' })
  async create(@Body() createContentDto: CreateContentDto) {
    return this.contentService.create(createContentDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update content (admin only)' })
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    return this.contentService.update(id, updateContentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete content (admin only)' })
  async remove(@Param('id') id: string) {
    return this.contentService.remove(id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle publish status (admin only)' })
  async togglePublish(@Param('id') id: string) {
    return this.contentService.togglePublish(id);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Increment view count' })
  async incrementViews(@Param('id') id: string) {
    return this.contentService.incrementViews(id);
  }
}
