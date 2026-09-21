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
exports.CommandsService = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var telegraf_1 = require("telegraf");
var prisma_service_1 = require("../prisma/prisma.service");
var CommandsService = /** @class */ (function () {
    function CommandsService(config, prisma) {
        this.config = config;
        this.prisma = prisma;
    }
    CommandsService.prototype.handleStart = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, username, firstName, lastName, webAppUrl, keyboard;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = ctx.from.id;
                        username = ctx.from.username || '';
                        firstName = ctx.from.first_name || '';
                        lastName = ctx.from.last_name || '';
                        // Save or update user in database
                        return [4 /*yield*/, this.prisma.user.upsert({
                                where: { telegramId: userId.toString() },
                                update: {
                                    username: username,
                                    firstName: firstName,
                                    lastName: lastName,
                                    lastActiveAt: new Date(),
                                },
                                create: {
                                    telegramId: userId.toString(),
                                    username: username,
                                    firstName: firstName,
                                    lastName: lastName,
                                    isVip: false,
                                },
                            })];
                    case 1:
                        // Save or update user in database
                        _a.sent();
                        webAppUrl = this.config.get('WEB_APP_URL');
                        keyboard = telegraf_1.Markup.inlineKeyboard([
                            [telegraf_1.Markup.button.webApp('🎬 Open MANYAK TV', webAppUrl)],
                            [telegraf_1.Markup.button.callback('💎 VIP Subscription', 'vip_info')],
                            [telegraf_1.Markup.button.callback('ℹ️ Help', 'help')],
                        ]);
                        return [4 /*yield*/, ctx.reply("\uD83D\uDC4B Salom, ".concat(firstName, "!\n\n") +
                                "\uD83C\uDFAC MANYAK TV - O'zbek kinolar\u0131 va seriallar platformasiga xush kelibsiz!\n\n" +
                                "\uD83C\uDFAF Bu yerda:\n" +
                                "\u2705 Barcha O'zbek kinolar\n" +
                                "\u2705 Seriallar va Multfilmlar\n" +
                                "\u2705 HD sifat\n" +
                                "\u2705 Har kuni yangiliklar\n\n" +
                                "\uD83D\uDE80 Boshlash uchun tugmani bosing:", keyboard)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CommandsService.prototype.handleVip = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, user, keyboard, daysLeft;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = ctx.from.id.toString();
                        return [4 /*yield*/, this.prisma.user.findUnique({
                                where: { telegramId: userId },
                            })];
                    case 1:
                        user = _a.sent();
                        keyboard = telegraf_1.Markup.inlineKeyboard([
                            [telegraf_1.Markup.button.callback('💳 Subscribe to VIP', 'subscribe_vip')],
                            [telegraf_1.Markup.button.callback('« Back', 'back_to_start')],
                        ]);
                        if (!((user === null || user === void 0 ? void 0 : user.isVip) && (user === null || user === void 0 ? void 0 : user.vipExpiresAt))) return [3 /*break*/, 3];
                        daysLeft = Math.ceil((user.vipExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return [4 /*yield*/, ctx.reply("\uD83D\uDC8E VIP Status: ACTIVE \u2705\n\n" +
                                "\u23F1 Expires in: ".concat(daysLeft, " days\n") +
                                "\uD83D\uDCC5 Valid until: ".concat(user.vipExpiresAt.toLocaleDateString(), "\n\n") +
                                "\uD83C\uDF81 VIP Benefits:\n" +
                                "\u2705 Unlimited access\n" +
                                "\u2705 No ads\n" +
                                "\u2705 HD quality\n" +
                                "\u2705 Early access to new content", keyboard)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, ctx.reply("\uD83D\uDC8E VIP Subscription\n\n" +
                            "\uD83C\uDF81 Get VIP access and enjoy:\n" +
                            "\u2705 Unlimited movies & series\n" +
                            "\u2705 Ad-free experience\n" +
                            "\u2705 HD quality\n" +
                            "\u2705 Early access to new content\n\n" +
                            "\uD83D\uDCB0 Plans:\n" +
                            "\uD83D\uDCCD 1 Month - 50,000 UZS\n" +
                            "\uD83D\uDCCD 3 Months - 120,000 UZS (Save 20%)\n" +
                            "\uD83D\uDCCD 1 Year - 400,000 UZS (Save 33%)\n\n" +
                            "\uD83D\uDD25 Subscribe now!", keyboard)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    CommandsService.prototype.handleHelp = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var keyboard;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        keyboard = telegraf_1.Markup.inlineKeyboard([
                            [telegraf_1.Markup.button.callback('💎 VIP Info', 'vip_info')],
                            [telegraf_1.Markup.button.url('📞 Support', 't.me/manyaktv_support')],
                            [telegraf_1.Markup.button.callback('« Back', 'back_to_start')],
                        ]);
                        return [4 /*yield*/, ctx.reply("\u2139\uFE0F MANYAK TV - Help\n\n" +
                                "\uD83D\uDCF1 How to use:\n" +
                                "1\uFE0F\u20E3 Click \"Open MANYAK TV\" button\n" +
                                "2\uFE0F\u20E3 Browse movies & series\n" +
                                "3\uFE0F\u20E3 Watch instantly!\n\n" +
                                "\uD83D\uDC8E VIP Subscription:\n" +
                                "Get unlimited access to all content\n\n" +
                                "\uD83D\uDCDE Support:\n" +
                                "If you have any questions, contact @manyaktv_support\n\n" +
                                "\uD83C\uDFAC Enjoy!", keyboard)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CommandsService.prototype.handleCallback = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var callbackData, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        callbackData = ctx.callbackQuery.data;
                        return [4 /*yield*/, ctx.answerCbQuery()];
                    case 1:
                        _b.sent();
                        _a = callbackData;
                        switch (_a) {
                            case 'vip_info': return [3 /*break*/, 2];
                            case 'subscribe_vip': return [3 /*break*/, 4];
                            case 'help': return [3 /*break*/, 6];
                            case 'back_to_start': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2: return [4 /*yield*/, this.handleVip(ctx)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 4: return [4 /*yield*/, this.handleSubscribeVip(ctx)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 6: return [4 /*yield*/, this.handleHelp(ctx)];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 8: return [4 /*yield*/, this.handleStart(ctx)];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, ctx.reply('Unknown command')];
                    case 11:
                        _b.sent();
                        _b.label = 12;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    CommandsService.prototype.handleSubscribeVip = function (ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var keyboard;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        keyboard = telegraf_1.Markup.inlineKeyboard([
                            [telegraf_1.Markup.button.callback('📍 1 Month - 50K', 'plan_1month')],
                            [telegraf_1.Markup.button.callback('📍 3 Months - 120K', 'plan_3months')],
                            [telegraf_1.Markup.button.callback('📍 1 Year - 400K', 'plan_1year')],
                            [telegraf_1.Markup.button.callback('« Back', 'vip_info')],
                        ]);
                        return [4 /*yield*/, ctx.reply("\uD83D\uDCB3 Choose your VIP plan:\n\n" +
                                "\uD83D\uDCCD 1 Month - 50,000 UZS\n" +
                                "\uD83D\uDCCD 3 Months - 120,000 UZS (Save 20%)\n" +
                                "\uD83D\uDCCD 1 Year - 400,000 UZS (Save 33%)\n\n" +
                                "After selecting, you'll receive payment instructions.", keyboard)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CommandsService = __decorate([
        (0, common_1.Injectable)(),
        __metadata("design:paramtypes", [config_1.ConfigService,
            prisma_service_1.PrismaService])
    ], CommandsService);
    return CommandsService;
}());
exports.CommandsService = CommandsService;
