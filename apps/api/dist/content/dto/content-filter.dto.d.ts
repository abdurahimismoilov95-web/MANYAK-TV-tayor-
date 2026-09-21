import { ContentType } from '@prisma/client';
export declare class ContentFilterDto {
    type?: ContentType;
    categoryId?: string;
    isPremium?: boolean;
    isPublished?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
