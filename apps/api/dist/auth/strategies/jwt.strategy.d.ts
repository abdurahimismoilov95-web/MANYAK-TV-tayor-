import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from '../auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private config;
    private authService;
    constructor(config: ConfigService, authService: AuthService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        telegramId: string;
        deviceToken: string | null;
        firstName: string;
        lastName: string | null;
        username: string | null;
        phoneNumber: string | null;
        isPhoneVerified: boolean;
        isVip: boolean;
        vipExpiresAt: Date | null;
        vipDiscountPercent: number;
        bonusBalance: number;
        dailyCheckIn: import(".prisma/client/runtime/library").JsonValue | null;
        hwid: import(".prisma/client/runtime/library").JsonValue | null;
        isBanned: boolean;
        banReason: string | null;
        isDeviceBanned: boolean;
        createdAt: Date;
        lastLoginAt: Date | null;
    }>;
}
export {};
