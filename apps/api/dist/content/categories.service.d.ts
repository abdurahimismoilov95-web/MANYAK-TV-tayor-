import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            contents: number;
        };
    } & {
        name: string;
        id: string;
        slug: string;
        icon: string | null;
        order: number;
    })[]>;
    findOne(id: string): Promise<{
        contents: ({
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
            contentId: string;
            categoryId: string;
        })[];
    } & {
        name: string;
        id: string;
        slug: string;
        icon: string | null;
        order: number;
    }>;
    create(data: {
        name: string;
        slug: string;
        icon?: string;
        order?: number;
    }): Promise<{
        name: string;
        id: string;
        slug: string;
        icon: string | null;
        order: number;
    }>;
    update(id: string, data: Partial<{
        name: string;
        slug: string;
        icon: string;
        order: number;
    }>): Promise<{
        name: string;
        id: string;
        slug: string;
        icon: string | null;
        order: number;
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        slug: string;
        icon: string | null;
        order: number;
    }>;
}
