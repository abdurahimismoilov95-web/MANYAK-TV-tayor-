import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    telegramId: string;
    isVip: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    private config;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService);
    verifyTelegramInitData(initData: string): Promise<any>;
    loginWithTelegram(initData: string): Promise<{
        ok: boolean;
        token: string;
        user: {
            id: string;
            telegramId: string;
            firstName: string;
            lastName: string | null;
            username: string | null;
            isVip: boolean;
            isAdmin: boolean;
            isSuperAdmin: boolean;
        };
    }>;
    validateUser(payload: JwtPayload): Promise<{
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
    getCurrentUser(userId: string): Promise<{
        isAdmin: boolean;
        isSuperAdmin: boolean;
        adminPermissions: import(".prisma/client/runtime/library").JsonValue | undefined;
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
