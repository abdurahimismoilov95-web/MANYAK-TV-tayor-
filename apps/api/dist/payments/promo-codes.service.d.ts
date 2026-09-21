import { PrismaService } from '../prisma/prisma.service';
export declare class PromoCodesService {
    private prisma;
    constructor(prisma: PrismaService);
    validate(code: string): Promise<{
        valid: boolean;
        discountPercent: number;
        code: string;
    }>;
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        discountPercent: number;
        maxUses: number;
        currentUses: number;
        expiresAt: Date | null;
        isActive: boolean;
    }[]>;
    create(data: any): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        discountPercent: number;
        maxUses: number;
        currentUses: number;
        expiresAt: Date | null;
        isActive: boolean;
    }>;
    update(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        discountPercent: number;
        maxUses: number;
        currentUses: number;
        expiresAt: Date | null;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        code: string;
        discountPercent: number;
        maxUses: number;
        currentUses: number;
        expiresAt: Date | null;
        isActive: boolean;
    }>;
}
