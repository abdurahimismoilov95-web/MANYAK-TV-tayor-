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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
exports.WebhookController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var bot_service_1 = require("../bot/bot.service");
var broadcast_service_1 = require("../broadcast/broadcast.service");
var verification_service_1 = require("../verification/verification.service");
var dto_1 = require("./dto");
var WebhookController = /** @class */ (function () {
    function WebhookController(botService, broadcastService, verificationService) {
        this.botService = botService;
        this.broadcastService = broadcastService;
        this.verificationService = verificationService;
    }
    /**
     * Telegram webhook endpoint
     */
    WebhookController.prototype.handleTelegramWebhook = function (update) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.botService.getBot().handleUpdate(update)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Webhook error:', error_1);
                        return [2 /*return*/, { ok: false, error: error_1.message }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send broadcast (admin only)
     */
    WebhookController.prototype.sendBroadcast = function (body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.broadcastService.sendBroadcast(body)];
            });
        });
    };
    /**
     * Get broadcast history
     */
    WebhookController.prototype.getBroadcastHistory = function () {
        return __awaiter(this, arguments, void 0, function (page, limit) {
            var pageNum, limitNum;
            if (page === void 0) { page = '1'; }
            if (limit === void 0) { limit = '10'; }
            return __generator(this, function (_a) {
                pageNum = parseInt(page, 10);
                limitNum = parseInt(limit, 10);
                return [2 /*return*/, this.broadcastService.getBroadcastHistory(pageNum, limitNum)];
            });
        });
    };
    /**
     * Create verification code
     */
    WebhookController.prototype.createVerification = function (body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.verificationService.createVerification(body.telegramId, body.phoneNumber)];
            });
        });
    };
    /**
     * Verify code
     */
    WebhookController.prototype.verifyCode = function (body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.verificationService.verifyCode(body.telegramId, body.code)];
            });
        });
    };
    /**
     * Health check
     */
    WebhookController.prototype.health = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { status: 'ok', service: 'bot', timestamp: new Date() }];
            });
        });
    };
    __decorate([
        (0, common_1.Post)('telegram'),
        (0, swagger_1.ApiOperation)({ summary: 'Handle Telegram webhook updates' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' }),
        __param(0, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], WebhookController.prototype, "handleTelegramWebhook", null);
    __decorate([
        (0, common_1.Post)('broadcast'),
        (0, swagger_1.ApiOperation)({ summary: 'Create broadcast message' }),
        (0, swagger_1.ApiBody)({ type: dto_1.BroadcastDto }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Broadcast created successfully' }),
        __param(0, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [dto_1.BroadcastDto]),
        __metadata("design:returntype", Promise)
    ], WebhookController.prototype, "sendBroadcast", null);
    __decorate([
        (0, common_1.Get)('broadcast/history'),
        (0, swagger_1.ApiOperation)({ summary: 'Get broadcast history' }),
        (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
        (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Broadcast history retrieved' }),
        __param(0, (0, common_1.Query)('page')),
        __param(1, (0, common_1.Query)('limit')),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, String]),
        __metadata("design:returntype", Promise)
    ], WebhookController.prototype, "getBroadcastHistory", null);
    __decorate([
        (0, common_1.Post)('verification/create'),
        (0, swagger_1.ApiOperation)({ summary: 'Create phone verification' }),
        (0, swagger_1.ApiBody)({ type: dto_1.CreateVerificationDto }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'Verification created' }),
        __param(0, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [dto_1.CreateVerificationDto]),
        __metadata("design:returntype", Promise)
    ], WebhookController.prototype, "createVerification", null);
    __decorate([
        (0, common_1.Post)('verification/verify'),
        (0, swagger_1.ApiOperation)({ summary: 'Verify phone code' }),
        (0, swagger_1.ApiBody)({ type: dto_1.VerifyCodeDto }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Code verified' }),
        __param(0, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [dto_1.VerifyCodeDto]),
        __metadata("design:returntype", Promise)
    ], WebhookController.prototype, "verifyCode", null);
    __decorate([
        (0, common_1.Get)('health'),
        (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is healthy' }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Promise)
    ], WebhookController.prototype, "health", null);
    WebhookController = __decorate([
        (0, swagger_1.ApiTags)('Webhook'),
        (0, common_1.Controller)('webhook'),
        __metadata("design:paramtypes", [bot_service_1.BotService,
            broadcast_service_1.BroadcastService,
            verification_service_1.VerificationService])
    ], WebhookController);
    return WebhookController;
}());
exports.WebhookController = WebhookController;
