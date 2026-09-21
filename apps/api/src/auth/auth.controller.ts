import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

class LoginDto {
  initData: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('verify')
  @ApiOperation({ summary: 'Verify Telegram WebApp initData and login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        initData: { type: 'string', description: 'Telegram WebApp initData' },
      },
    },
  })
  async login(@Body() body: LoginDto) {
    return this.authService.loginWithTelegram(body.initData);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getCurrentUser(userId);
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if token is valid' })
  async checkAuth(@CurrentUser() user: any) {
    return {
      ok: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        isVip: user.isVip,
      },
    };
  }
}
