import { PaymentsService } from './payments.service';
import { PlansService } from './plans.service';
import { PromoCodesService } from './promo-codes.service';
export declare class PaymentsController {
    private paymentsService;
    private plansService;
    private promoCodesService;
    constructor(paymentsService: PaymentsService, plansService: PlansService, promoCodesService: PromoCodesService);
    getPlans(): Promise<{
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
    validatePromo(body: {
        code: string;
    }): Promise<{
        valid: boolean;
        discountPercent: number;
        code: string;
    }>;
    create(userId: string, body: any): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.PaymentType;
        userId: string;
        contentId: string | null;
        amount: number;
        discountApplied: number;
        promoCodeUsed: string | null;
        contentTitle: string | null;
        receiptImageUrl: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        planId: string | null;
    }>;
    getMyPayments(userId: string): Promise<({
        plan: {
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
        } | null;
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.PaymentType;
        userId: string;
        contentId: string | null;
        amount: number;
        discountApplied: number;
        promoCodeUsed: string | null;
        contentTitle: string | null;
        receiptImageUrl: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        planId: string | null;
    })[]>;
    getStats(): Promise<{
        totalPayments: number;
        pendingPayments: number;
        approvedPayments: number;
        rejectedPayments: number;
        totalRevenue: number;
        todayRevenue: number;
    }>;
    findAll(status?: string, page?: number, limit?: number): Promise<{
        payments: ({
            user: {
                id: string;
                telegramId: string;
                deviceToken: string | null;
                firstName: string;
                lastName: string | null;
                username: string | null;
                phoneNumber: string | null;
                isPhoneVerified: boolean;
                isVip: boolean;
                vipExpiresAt: Date | null;
                vipDiscountPercent: number;
                bonusBalance: number;
                dailyCheckIn: import(".prisma/client/runtime/library").JsonValue | null;
                hwid: import(".prisma/client/runtime/library").JsonValue | null;
                isBanned: boolean;
                banReason: string | null;
                isDeviceBanned: boolean;
                createdAt: Date;
                lastLoginAt: Date | null;
            };
        } & {
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.PaymentType;
            userId: string;
            contentId: string | null;
            amount: number;
            discountApplied: number;
            promoCodeUsed: string | null;
            contentTitle: string | null;
            receiptImageUrl: string | null;
            notes: string | null;
            reviewedAt: Date | null;
            reviewedBy: string | null;
            planId: string | null;
        })[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        user: {
            id: string;
            telegramId: string;
            deviceToken: string | null;
            firstName: string;
            lastName: string | null;
            username: string | null;
            phoneNumber: string | null;
            isPhoneVerified: boolean;
            isVip: boolean;
            vipExpiresAt: Date | null;
            vipDiscountPercent: number;
            bonusBalance: number;
            dailyCheckIn: import(".prisma/client/runtime/library").JsonValue | null;
            hwid: import(".prisma/client/runtime/library").JsonValue | null;
            isBanned: boolean;
            banReason: string | null;
            isDeviceBanned: boolean;
            createdAt: Date;
            lastLoginAt: Date | null;
        };
        plan: {
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
        } | null;
    } & {
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.PaymentType;
        userId: string;
        contentId: string | null;
        amount: number;
        discountApplied: number;
        promoCodeUsed: string | null;
        contentTitle: string | null;
        receiptImageUrl: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        planId: string | null;
    }>;
    approve(id: string, reviewerId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.PaymentType;
        userId: string;
        contentId: string | null;
        amount: number;
        discountApplied: number;
        promoCodeUsed: string | null;
        contentTitle: string | null;
        receiptImageUrl: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        planId: string | null;
    }>;
    reject(id: string, reviewerId: string, body: {
        reason?: string;
    }): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.PaymentType;
        userId: string;
        contentId: string | null;
        amount: number;
        discountApplied: number;
        promoCodeUsed: string | null;
        contentTitle: string | null;
        receiptImageUrl: string | null;
        notes: string | null;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        planId: string | null;
    }>;
}
