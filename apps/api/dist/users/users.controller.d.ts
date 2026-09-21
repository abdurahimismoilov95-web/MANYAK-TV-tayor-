import { UsersService } from './users.service';
import { UpdateUserDto, GrantVipDto, BanUserDto } from './dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(userId: string): Promise<{
        isAdmin: boolean;
        isSuperAdmin: boolean;
        watchHistory: ({
            content: {
                id: string;
                type: import(".prisma/client").$Enums.ContentType;
                title: string;
                posterUrl: string | null;
            };
        } & {
            id: string;
            watchedAt: Date;
            userId: string;
            contentId: string;
            episodeId: string | null;
            progressSeconds: number;
            totalSeconds: number;
        })[];
        favorites: ({
            content: {
                id: string;
                type: import(".prisma/client").$Enums.ContentType;
                title: string;
                posterUrl: string | null;
            };
        } & {
            userId: string;
            contentId: string;
            addedAt: Date;
        })[];
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
    updateMe(userId: string, updateUserDto: UpdateUserDto): Promise<{
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
    getMyFavorites(userId: string): Promise<any[]>;
    addToFavorites(userId: string, contentId: string): Promise<{
        userId: string;
        contentId: string;
        addedAt: Date;
    }>;
    removeFromFavorites(userId: string, contentId: string): Promise<{
        userId: string;
        contentId: string;
        addedAt: Date;
    }>;
    getMyHistory(userId: string, limit?: number): Promise<({
        content: {
            description: string | null;
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.ContentType;
            title: string;
            posterUrl: string | null;
            trailerUrl: string | null;
            videoUrl: string | null;
            duration: number | null;
            quality: string[];
            year: number | null;
            country: string | null;
            language: string | null;
            ageRating: string | null;
            imdbRating: number | null;
            genres: string[];
            cast: string[];
            director: string | null;
            isPremium: boolean;
            price: number | null;
            unlockWithTokens: number | null;
            viewsCount: number;
            views: number;
            likesCount: number;
            revenue: number;
            isPublished: boolean;
            isFeatured: boolean;
            publishedAt: Date | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        watchedAt: Date;
        userId: string;
        contentId: string;
        episodeId: string | null;
        progressSeconds: number;
        totalSeconds: number;
    })[]>;
    updateProgress(userId: string, body: {
        contentId: string;
        progressSeconds: number;
        totalSeconds: number;
        episodeId?: string;
    }): Promise<{
        id: string;
        watchedAt: Date;
        userId: string;
        contentId: string;
        episodeId: string | null;
        progressSeconds: number;
        totalSeconds: number;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        users: {
            id: string;
            telegramId: string;
            firstName: string;
            lastName: string | null;
            username: string | null;
            isVip: boolean;
            vipExpiresAt: Date | null;
            isBanned: boolean;
            createdAt: Date;
            lastLoginAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getStats(): Promise<{
        totalUsers: number;
        vipUsers: number;
        bannedUsers: number;
        activeToday: number;
    }>;
    findOne(id: string): Promise<{
        isAdmin: boolean;
        isSuperAdmin: boolean;
        watchHistory: ({
            content: {
                id: string;
                type: import(".prisma/client").$Enums.ContentType;
                title: string;
                posterUrl: string | null;
            };
        } & {
            id: string;
            watchedAt: Date;
            userId: string;
            contentId: string;
            episodeId: string | null;
            progressSeconds: number;
            totalSeconds: number;
        })[];
        favorites: ({
            content: {
                id: string;
                type: import(".prisma/client").$Enums.ContentType;
                title: string;
                posterUrl: string | null;
            };
        } & {
            userId: string;
            contentId: string;
            addedAt: Date;
        })[];
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
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
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
    grantVip(id: string, grantVipDto: GrantVipDto): Promise<{
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
    revokeVip(id: string): Promise<{
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
    banUser(id: string, banDto: BanUserDto): Promise<{
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
    unbanUser(id: string): Promise<{
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
