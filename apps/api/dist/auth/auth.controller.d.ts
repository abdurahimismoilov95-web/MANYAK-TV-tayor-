import { AuthService } from './auth.service';
declare class LoginDto {
    initData: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: LoginDto): Promise<{
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
    getProfile(userId: string): Promise<{
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
    checkAuth(user: any): Promise<{
        ok: boolean;
        user: {
            id: any;
            telegramId: any;
            firstName: any;
            isVip: any;
        };
    }>;
}
export {};
