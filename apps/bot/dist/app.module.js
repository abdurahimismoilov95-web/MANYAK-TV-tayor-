"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var bot_service_1 = require("./bot/bot.service");
var webhook_controller_1 = require("./webhook/webhook.controller");
var commands_service_1 = require("./commands/commands.service");
var verification_service_1 = require("./verification/verification.service");
var broadcast_service_1 = require("./broadcast/broadcast.service");
var prisma_service_1 = require("./prisma/prisma.service");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                }),
            ],
            controllers: [webhook_controller_1.WebhookController],
            providers: [
                bot_service_1.BotService,
                commands_service_1.CommandsService,
                verification_service_1.VerificationService,
                broadcast_service_1.BroadcastService,
                prisma_service_1.PrismaService,
            ],
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
