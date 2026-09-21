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
var bull_1 = require("@nestjs/bull");
var encoder_service_1 = require("./encoder/encoder.service");
var encoder_controller_1 = require("./encoder/encoder.controller");
var encoder_processor_1 = require("./encoder/encoder.processor");
var upload_service_1 = require("./upload/upload.service");
var upload_controller_1 = require("./upload/upload.controller");
var thumbnail_service_1 = require("./thumbnail/thumbnail.service");
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
                bull_1.BullModule.forRoot({
                    redis: {
                        host: process.env.REDIS_HOST || 'localhost',
                        port: parseInt(process.env.REDIS_PORT || '6379'),
                    },
                }),
                bull_1.BullModule.registerQueue({
                    name: 'video-encoding',
                }),
            ],
            controllers: [encoder_controller_1.EncoderController, upload_controller_1.UploadController],
            providers: [
                encoder_service_1.EncoderService,
                encoder_processor_1.EncoderProcessor,
                upload_service_1.UploadService,
                thumbnail_service_1.ThumbnailService,
                prisma_service_1.PrismaService,
            ],
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
