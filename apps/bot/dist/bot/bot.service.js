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
exports.BotService = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var telegraf_1 = require("telegraf");
var commands_service_1 = require("../commands/commands.service");
var BotService = /** @class */ (function () {
    function BotService(config, commandsService) {
        this.config = config;
        this.commandsService = commandsService;
        var token = this.config.get('TELEGRAM_BOT_TOKEN');
        if (!token) {
            throw new Error('TELEGRAM_BOT_TOKEN is not defined');
        }
        this.bot = new telegraf_1.Telegraf(token);
    }
    BotService.prototype.onModuleInit = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.setupCommands()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.setupHandlers()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.launch()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotService.prototype.setupCommands = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.bot.telegram.setMyCommands([
                            { command: 'start', description: 'Start the bot & open web app' },
                            { command: 'vip', description: 'VIP subscription info' },
                            { command: 'help', description: 'Get help' },
                        ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    BotService.prototype.setupHandlers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                // /start command
                this.bot.command('start', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.commandsService.handleStart(ctx)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                // /vip command
                this.bot.command('vip', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.commandsService.handleVip(ctx)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                // /help command
                this.bot.command('help', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.commandsService.handleHelp(ctx)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                // Callback queries (inline buttons)
                this.bot.on('callback_query', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.commandsService.handleCallback(ctx)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                // Messages
                this.bot.on('message', function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: 
                            // Auto-reply for unknown messages
                            return [4 /*yield*/, ctx.reply('Please use commands or buttons to interact with the bot.')];
                            case 1:
                                // Auto-reply for unknown messages
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    BotService.prototype.launch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var webhookUrl;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        webhookUrl = this.config.get('WEBHOOK_URL');
                        if (!webhookUrl) return [3 /*break*/, 2];
                        // Production: webhook mode
                        return [4 /*yield*/, this.bot.telegram.setWebhook(webhookUrl)];
                    case 1:
                        // Production: webhook mode
                        _a.sent();
                        console.log("\u2705 Webhook set: ".concat(webhookUrl));
                        return [3 /*break*/, 4];
                    case 2: 
                    // Development: polling mode
                    return [4 /*yield*/, this.bot.launch()];
                    case 3:
                        // Development: polling mode
                        _a.sent();
                        console.log('✅ Bot started in polling mode');
                        _a.label = 4;
                    case 4:
                        // Graceful shutdown
                        process.once('SIGINT', function () { return _this.bot.stop('SIGINT'); });
                        process.once('SIGTERM', function () { return _this.bot.stop('SIGTERM'); });
                        return [2 /*return*/];
                }
            });
        });
    };
    BotService.prototype.getBot = function () {
        return this.bot;
    };
    BotService.prototype.sendMessage = function (chatId, text, extra) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.bot.telegram.sendMessage(chatId, text, extra)];
            });
        });
    };
    BotService = __decorate([
        (0, common_1.Injectable)(),
        __metadata("design:paramtypes", [config_1.ConfigService,
            commands_service_1.CommandsService])
    ], BotService);
    return BotService;
}());
exports.BotService = BotService;
