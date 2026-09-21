import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(data: {
        adminId: string;
        adminName: string;
        action: string;
        targetType?: string;
        targetId?: string;
        targetTitle?: string;
        details?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        adminId: string;
        adminName: string;
        action: string;
        targetType: string | null;
        targetId: string | null;
        targetTitle: string | null;
        details: string | null;
        secondaryAuthPassed: boolean;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        logs: {
            id: number;
            createdAt: Date;
            adminId: string;
            adminName: string;
            action: string;
            targetType: string | null;
            targetId: string | null;
            targetTitle: string | null;
            details: string | null;
            secondaryAuthPassed: boolean;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
}
