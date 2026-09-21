import { ContentType } from '@prisma/client';
export declare class CreateContentDto {
    type: ContentType;
    title: string;
    description?: string;
    posterUrl?: string;
    trailerUrl?: string;
    videoUrl?: string;
    duration?: number;
    quality?: string[];
    year?: number;
    country?: string;
    language?: string;
    ageRating?: string;
    imdbRating?: number;
    genres?: string[];
    cast?: string[];
    director?: string;
    isPremium?: boolean;
    price?: number;
    unlockWithTokens?: number;
    isPublished?: boolean;
    categories?: string[];
}
