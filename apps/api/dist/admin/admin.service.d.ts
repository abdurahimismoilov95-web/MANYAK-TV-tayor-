import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        name: string;
        id: string;
        telegramId: string;
        username: string | null;
        roleTitle: string;
        isSuperAdmin: boolean;
        permissions: import(".prisma/client/runtime/library").JsonValue;
        appointedBy: string | null;
        appointedAt: Date;
    }[]>;
    create(data: any): Promise<{
        name: string;
        id: string;
        telegramId: string;
        username: string | null;
        roleTitle: string;
        isSuperAdmin: boolean;
        permissions: import(".prisma/client/runtime/library").JsonValue;
        appointedBy: string | null;
        appointedAt: Date;
    }>;
    update(id: string, data: any): Promise<{
        name: string;
        id: string;
        telegramId: string;
        username: string | null;
        roleTitle: string;
        isSuperAdmin: boolean;
        permissions: import(".prisma/client/runtime/library").JsonValue;
        appointedBy: string | null;
        appointedAt: Date;
    }>;
    remove(id: string): Promise<{
        name: string;
        id: string;
        telegramId: string;
        username: string | null;
        roleTitle: string;
        isSuperAdmin: boolean;
        permissions: import(".prisma/client/runtime/library").JsonValue;
        appointedBy: string | null;
        appointedAt: Date;
    }>;
    getSystemStats(): Promise<{
        users: number;
        content: number;
        payments: number;
        admins: number;
    }>;
}
