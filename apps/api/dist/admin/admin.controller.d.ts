import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
export declare class AdminController {
    private adminService;
    private auditService;
    constructor(adminService: AdminService, auditService: AuditService);
    getStats(): Promise<{
        users: number;
        content: number;
        payments: number;
        admins: number;
    }>;
    getAuditLogs(page?: number, limit?: number): Promise<{
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
    getAdmins(): Promise<{
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
    createAdmin(data: any): Promise<{
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
}
