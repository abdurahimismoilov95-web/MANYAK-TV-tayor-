import { PrismaService } from '../prisma/prisma.service';
export declare class ContentStatsService {
    private prisma;
    constructor(prisma: PrismaService);
    incrementViews(contentId: string): Promise<{
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
    }>;
    getStats(): Promise<{
        totalContent: number;
        movies: number;
        series: number;
        totalViews: number;
        totalRevenue: number;
    }>;
    getTopViewed(limit?: number): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ContentType;
        title: string;
        views: number;
    }[]>;
    getRevenueStats(): Promise<{
        id: string;
        title: string;
        revenue: number;
    }[]>;
}
