"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastService = void 0;
var common_1 = require("@nestjs/common");
var prisma_service_1 = require("../prisma/prisma.service");
var bot_service_1 = require("../bot/bot.service");
var BroadcastService = /** @class */ (function () {
    function BroadcastService(prisma, botService) {
        this.prisma = prisma;
        this.botService = botService;
    }
    /**
     * Send broadcast message to users
     */
    BroadcastService.prototype.sendBroadcast = function (dto) {
        return __awaiter(this, void 0, void 0, function () {
            var message, targetUserIds, sendToAll, vipOnly, targetType, users, successCount, failCount, _i, users_1, user, chatId, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = dto.message, targetUserIds = dto.targetUserIds, sendToAll = dto.sendToAll, vipOnly = dto.vipOnly;
                        targetType = 'ALL';
                        if (vipOnly) {
                            targetType = 'VIP';
                        }
                        else if (targetUserIds && targetUserIds.length > 0) {
                            targetType = 'CUSTOM';
                        }
                        else if (sendToAll) {
                            targetType = 'ALL';
                        }
                        return [4 /*yield*/, this.getTargetUsers(targetType, targetUserIds)];
                    case 1:
                        users = _a.sent();
                        successCount = 0;
                        failCount = 0;
                        _i = 0, users_1 = users;
                        _a.label = 2;
                    case 2:
                        if (!(_i < users_1.length)) return [3 /*break*/, 8];
                        user = users_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 6, , 7]);
                        chatId = parseInt(user.telegramId);
                        return [4 /*yield*/, this.botService.sendMessage(chatId, message, {
                                parse_mode: 'HTML',
                            })];
                    case 4:
                        _a.sent();
                        successCount++;
                        // Add small delay to avoid rate limiting
                        return [4 /*yield*/, this.sleep(100)];
                    case 5:
                        // Add small delay to avoid rate limiting
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        failCount++;
                        console.error("Failed to send to ".concat(user.telegramId, ":"), error_1.message);
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: 
                    // Save broadcast log
                    return [4 /*yield*/, this.prisma.broadcastLog.create({
                            data: {
                                message: message,
                                targetType: targetType,
                                totalSent: successCount,
                                totalFailed: failCount,
                            },
                        })];
                    case 9:
                        // Save broadcast log
                        _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                totalUsers: users.length,
                                successCount: successCount,
                                failCount: failCount,
                            }];
                }
            });
        });
    };
    /**
     * Get target users based on type
     */
    BroadcastService.prototype.getTargetUsers = function (targetType, targetUserIds) {
        return __awaiter(this, void 0, void 0, function () {
            var where;
            return __generator(this, function (_a) {
                where = {};
                if (targetType === 'VIP') {
                    where.isVip = true;
                }
                else if (targetType === 'NON_VIP') {
                    where.isVip = false;
                }
                else if (targetType === 'CUSTOM' && targetUserIds) {
                    where.telegramId = { in: targetUserIds };
                }
                return [2 /*return*/, this.prisma.user.findMany({
                        where: where,
                        select: { telegramId: true },
                    })];
            });
        });
    };
    /**
     * Get broadcast history
     */
    BroadcastService.prototype.getBroadcastHistory = function () {
        return __awaiter(this, arguments, void 0, function (page, limit) {
            var skip, _a, broadcasts, total;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        skip = (page - 1) * limit;
                        return [4 /*yield*/, Promise.all([
                                this.prisma.broadcastLog.findMany({
                                    skip: skip,
                                    take: limit,
                                    orderBy: { createdAt: 'desc' },
                                }),
                                this.prisma.broadcastLog.count(),
                            ])];
                    case 1:
                        _a = _b.sent(), broadcasts = _a[0], total = _a[1];
                        return [2 /*return*/, {
                                broadcasts: broadcasts,
                                total: total,
                                page: page,
                                totalPages: Math.ceil(total / limit),
                            }];
                }
            });
        });
    };
    /**
     * Helper: sleep
     */
    BroadcastService.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    BroadcastService = __decorate([
        (0, common_1.Injectable)(),
        __metadata("design:paramtypes", [prisma_service_1.PrismaService,
            bot_service_1.BotService])
    ], BroadcastService);
    return BroadcastService;
}());
exports.BroadcastService = BroadcastService;
