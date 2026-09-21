import { PrismaService } from '../prisma/prisma.service';
export declare class PlansService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        durationDays: number;
        price: number;
        updatedAt: Date;
        isActive: boolean;
        originalPrice: number | null;
        badge: string | null;
        features: string[];
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        durationDays: number;
        price: number;
        updatedAt: Date;
        isActive: boolean;
        originalPrice: number | null;
        badge: string | null;
        features: string[];
    } | null>;
    create(data: any): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        durationDays: number;
        price: number;
        updatedAt: Date;
        isActive: boolean;
        originalPrice: number | null;
        badge: string | null;
        features: string[];
    }>;
    update(id: string, data: any): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        durationDays: number;
        price: number;
        updatedAt: Date;
        isActive: boolean;
        originalPrice: number | null;
        badge: string | null;
        features: string[];
    }>;
    remove(id: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        durationDays: number;
        price: number;
        updatedAt: Date;
        isActive: boolean;
        originalPrice: number | null;
        badge: string | null;
        features: string[];
    }>;
}
