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
import { UsersService } from './users.service';
import { UpdateUserDto, GrantVipDto, BanUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  @Get('me/favorites')
  @ApiOperation({ summary: 'Get user favorites' })
  async getMyFavorites(@CurrentUser('id') userId: string) {
    return this.usersService.getFavorites(userId);
  }

  @Post('me/favorites/:contentId')
  @ApiOperation({ summary: 'Add to favorites' })
  async addToFavorites(
    @CurrentUser('id') userId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.usersService.addFavorite(userId, contentId);
  }

  @Delete('me/favorites/:contentId')
  @ApiOperation({ summary: 'Remove from favorites' })
  async removeFromFavorites(
    @CurrentUser('id') userId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.usersService.removeFavorite(userId, contentId);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Get watch history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getWatchHistory(userId, limit);
  }

  @Post('me/watch-progress')
  @ApiOperation({ summary: 'Update watch progress' })
  async updateProgress(
    @CurrentUser('id') userId: string,
    @Body() body: {
      contentId: string;
      progressSeconds: number;
      totalSeconds: number;
      episodeId?: string;
    },
  ) {
    return this.usersService.updateWatchProgress(
      userId,
      body.contentId,
      body.progressSeconds,
      body.totalSeconds,
      body.episodeId,
    );
  }

  // ========== ADMIN ENDPOINTS ==========

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.findAll(page, limit);
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get user statistics (admin only)' })
  async getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update user (admin only)' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/grant-vip')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Grant VIP to user (admin only)' })
  async grantVip(
    @Param('id') id: string,
    @Body() grantVipDto: GrantVipDto,
  ) {
    return this.usersService.grantVip(id, grantVipDto);
  }

  @Post(':id/revoke-vip')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Revoke VIP from user (admin only)' })
  async revokeVip(@Param('id') id: string) {
    return this.usersService.revokeVip(id);
  }

  @Post(':id/ban')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Ban user (admin only)' })
  async banUser(@Param('id') id: string, @Body() banDto: BanUserDto) {
    return this.usersService.banUser(id, banDto);
  }

  @Post(':id/unban')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Unban user (admin only)' })
  async unbanUser(@Param('id') id: string) {
    return this.usersService.unbanUser(id);
  }
}
