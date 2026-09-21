import { PrismaService } from '../prisma/prisma.service';
import { ContentType } from '@prisma/client';
interface SearchOptions {
    query?: string;
    type?: ContentType;
    categoryId?: string;
    isFree?: boolean;
    page?: number;
    limit?: number;
}
export declare class ContentSearchService {
    private prisma;
    constructor(prisma: PrismaService);
    search(options: SearchOptions): Promise<{
        contents: ({
            categories: ({
                category: {
                    name: string;
                    id: string;
                    slug: string;
                    icon: string | null;
                    order: number;
                };
            } & {
                contentId: string;
                categoryId: string;
            })[];
        } & {
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
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getTrending(limit?: number): Promise<{
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
    }[]>;
    getSimilar(contentId: string, limit?: number): Promise<{
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
    }[]>;
}
export {};
