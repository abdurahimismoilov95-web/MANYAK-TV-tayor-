"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.EncoderProcessor = void 0;
var bull_1 = require("@nestjs/bull");
var encoder_service_1 = require("./encoder.service");
var thumbnail_service_1 = require("../thumbnail/thumbnail.service");
var prisma_service_1 = require("../prisma/prisma.service");
var path = __importStar(require("path"));
var EncoderProcessor = /** @class */ (function () {
    function EncoderProcessor(encoderService, thumbnailService, prisma) {
        this.encoderService = encoderService;
        this.thumbnailService = thumbnailService;
        this.prisma = prisma;
    }
    EncoderProcessor.prototype.handleEncoding = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, contentId, inputPath, outputDir, qualities, metadata, duration, thumbnailPath, previewPath, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = job.data, contentId = _a.contentId, inputPath = _a.inputPath, outputDir = _a.outputDir, qualities = _a.qualities;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 13, , 15]);
                        console.log("Starting encoding job ".concat(job.id, " for content ").concat(contentId));
                        // Update progress: Getting metadata
                        return [4 /*yield*/, job.progress(10)];
                    case 2:
                        // Update progress: Getting metadata
                        _b.sent();
                        return [4 /*yield*/, this.encoderService.getVideoMetadata(inputPath)];
                    case 3:
                        metadata = _b.sent();
                        duration = metadata.format.duration;
                        console.log("Video duration: ".concat(duration, "s"));
                        // Update progress: Generating thumbnail
                        return [4 /*yield*/, job.progress(20)];
                    case 4:
                        // Update progress: Generating thumbnail
                        _b.sent();
                        thumbnailPath = path.join(outputDir, 'thumbnail.jpg');
                        return [4 /*yield*/, this.thumbnailService.generateFromVideo(inputPath, thumbnailPath)];
                    case 5:
                        _b.sent();
                        // Update progress: Encoding to HLS
                        return [4 /*yield*/, job.progress(30)];
                    case 6:
                        // Update progress: Encoding to HLS
                        _b.sent();
                        return [4 /*yield*/, this.encoderService.encodeToHLS(inputPath, outputDir, qualities)];
                    case 7:
                        _b.sent();
                        // Update progress: Generating preview
                        return [4 /*yield*/, job.progress(90)];
                    case 8:
                        // Update progress: Generating preview
                        _b.sent();
                        previewPath = path.join(outputDir, 'preview.mp4');
                        return [4 /*yield*/, this.encoderService.generatePreview(inputPath, previewPath, 30)];
                    case 9:
                        _b.sent();
                        // Update content in database
                        return [4 /*yield*/, job.progress(95)];
                    case 10:
                        // Update content in database
                        _b.sent();
                        return [4 /*yield*/, this.prisma.content.update({
                                where: { id: contentId },
                                data: {
                                    processingStatus: 'COMPLETED',
                                    videoUrl: "".concat(outputDir, "/master.m3u8"),
                                    thumbnailUrl: thumbnailPath,
                                    duration: Math.floor(duration),
                                    availableQualities: qualities,
                                },
                            })];
                    case 11:
                        _b.sent();
                        return [4 /*yield*/, job.progress(100)];
                    case 12:
                        _b.sent();
                        console.log("Encoding job ".concat(job.id, " completed successfully"));
                        return [2 /*return*/, {
                                success: true,
                                contentId: contentId,
                                outputDir: outputDir,
                                duration: duration,
                            }];
                    case 13:
                        error_1 = _b.sent();
                        console.error("Encoding job ".concat(job.id, " failed:"), error_1);
                        // Mark as failed in database
                        return [4 /*yield*/, this.prisma.content.update({
                                where: { id: contentId },
                                data: { processingStatus: 'FAILED' },
                            })];
                    case 14:
                        // Mark as failed in database
                        _b.sent();
                        throw error_1;
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    __decorate([
        (0, bull_1.Process)('encode-video'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], EncoderProcessor.prototype, "handleEncoding", null);
    EncoderProcessor = __decorate([
        (0, bull_1.Processor)('video-encoding'),
        __metadata("design:paramtypes", [encoder_service_1.EncoderService,
            thumbnail_service_1.ThumbnailService,
            prisma_service_1.PrismaService])
    ], EncoderProcessor);
    return EncoderProcessor;
}());
exports.EncoderProcessor = EncoderProcessor;
