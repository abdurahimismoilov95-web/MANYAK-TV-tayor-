import { PrismaService } from '../prisma/prisma.service';
export declare class UsersContentService {
    private prisma;
    constructor(prisma: PrismaService);
    addFavorite(userId: string, contentId: string): Promise<{
        userId: string;
        contentId: string;
        addedAt: Date;
    }>;
    removeFavorite(userId: string, contentId: string): Promise<{
        userId: string;
        contentId: string;
        addedAt: Date;
    }>;
    getFavorites(userId: string, page?: number, limit?: number): Promise<{
        favorites: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    addToHistory(userId: string, contentId: string, watchedAt?: Date, progressSeconds?: number): Promise<{
        id: string;
        watchedAt: Date;
        userId: string;
        contentId: string;
        episodeId: string | null;
        progressSeconds: number;
        totalSeconds: number;
    }>;
    getHistory(userId: string, page?: number, limit?: number): Promise<{
        history: ({
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
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    clearHistory(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getProgress(userId: string, contentId: string): Promise<number>;
    hasPurchased(userId: string, contentId: string): Promise<boolean>;
    getPurchasedContent(userId: string): Promise<any[]>;
}
