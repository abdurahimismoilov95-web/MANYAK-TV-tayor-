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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncoderService = void 0;
var common_1 = require("@nestjs/common");
var bull_1 = require("@nestjs/bull");
var fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var prisma_service_1 = require("../prisma/prisma.service");
var EncoderService = /** @class */ (function () {
    function EncoderService(encodingQueue, prisma) {
        this.encodingQueue = encodingQueue;
        this.prisma = prisma;
    }
    /**
     * Add video to encoding queue
     */
    EncoderService.prototype.addToQueue = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.encodingQueue.add('encode-video', data, {
                            attempts: 3,
                            backoff: {
                                type: 'exponential',
                                delay: 5000,
                            },
                        })];
                    case 1:
                        job = _a.sent();
                        // Update content status
                        return [4 /*yield*/, this.prisma.content.update({
                                where: { id: data.contentId },
                                data: { processingStatus: 'PROCESSING' },
                            })];
                    case 2:
                        // Update content status
                        _a.sent();
                        return [2 /*return*/, {
                                jobId: job.id,
                                status: 'queued',
                                contentId: data.contentId,
                            }];
                }
            });
        });
    };
    /**
     * Get video metadata using FFprobe
     */
    EncoderService.prototype.getVideoMetadata = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        fluent_ffmpeg_1.default.ffprobe(filePath, function (err, metadata) {
                            if (err)
                                reject(err);
                            else
                                resolve(metadata);
                        });
                    })];
            });
        });
    };
    /**
     * Encode video to HLS with multiple qualities
     */
    EncoderService.prototype.encodeToHLS = function (inputPath_1, outputDir_1) {
        return __awaiter(this, arguments, void 0, function (inputPath, outputDir, qualities) {
            var qualitySettings, masterPlaylist, _i, qualities_1, quality, settings, qualityDir, playlistPath, bandwidth, masterPath;
            if (qualities === void 0) { qualities = ['720p', '480p', '360p']; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.ensureDir(outputDir)];
                    case 1:
                        _a.sent();
                        qualitySettings = {
                            '1080p': { width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
                            '720p': { width: 1280, height: 720, bitrate: '2800k', audioBitrate: '128k' },
                            '480p': { width: 854, height: 480, bitrate: '1400k', audioBitrate: '128k' },
                            '360p': { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
                        };
                        masterPlaylist = ['#EXTM3U', '#EXT-X-VERSION:3'];
                        _i = 0, qualities_1 = qualities;
                        _a.label = 2;
                    case 2:
                        if (!(_i < qualities_1.length)) return [3 /*break*/, 6];
                        quality = qualities_1[_i];
                        settings = qualitySettings[quality];
                        if (!settings)
                            return [3 /*break*/, 5];
                        qualityDir = path.join(outputDir, quality);
                        return [4 /*yield*/, fs.ensureDir(qualityDir)];
                    case 3:
                        _a.sent();
                        playlistPath = path.join(qualityDir, 'playlist.m3u8');
                        return [4 /*yield*/, this.encodeQuality(inputPath, qualityDir, settings)];
                    case 4:
                        _a.sent();
                        bandwidth = parseInt(settings.bitrate) * 1000;
                        masterPlaylist.push("#EXT-X-STREAM-INF:BANDWIDTH=".concat(bandwidth, ",RESOLUTION=").concat(settings.width, "x").concat(settings.height), "".concat(quality, "/playlist.m3u8"));
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6:
                        masterPath = path.join(outputDir, 'master.m3u8');
                        return [4 /*yield*/, fs.writeFile(masterPath, masterPlaylist.join('\n'))];
                    case 7:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Encode single quality variant
     */
    EncoderService.prototype.encodeQuality = function (inputPath, outputDir, settings) {
        return new Promise(function (resolve, reject) {
            var outputPath = path.join(outputDir, 'segment_%03d.ts');
            var playlistPath = path.join(outputDir, 'playlist.m3u8');
            (0, fluent_ffmpeg_1.default)(inputPath)
                .outputOptions([
                '-c:v libx264',
                '-c:a aac',
                "-b:v ".concat(settings.bitrate),
                "-b:a ".concat(settings.audioBitrate),
                "-vf scale=".concat(settings.width, ":").concat(settings.height),
                '-preset fast',
                '-profile:v main',
                '-level 4.0',
                '-start_number 0',
                '-hls_time 6',
                '-hls_list_size 0',
                "-hls_segment_filename ".concat(outputPath),
                '-f hls',
            ])
                .output(playlistPath)
                .on('start', function (cmd) {
                console.log("FFmpeg command: ".concat(cmd));
            })
                .on('progress', function (progress) {
                console.log("Processing ".concat(settings.width, "x").concat(settings.height, ": ").concat(progress.percent, "%"));
            })
                .on('end', function () {
                console.log("Finished encoding ".concat(settings.width, "x").concat(settings.height));
                resolve();
            })
                .on('error', function (err) {
                console.error("Error encoding ".concat(settings.width, "x").concat(settings.height, ":"), err);
                reject(err);
            })
                .run();
        });
    };
    /**
     * Generate preview/trailer clip
     */
    EncoderService.prototype.generatePreview = function (inputPath_1, outputPath_1) {
        return __awaiter(this, arguments, void 0, function (inputPath, outputPath, duration) {
            if (duration === void 0) { duration = 30; }
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        (0, fluent_ffmpeg_1.default)(inputPath)
                            .setStartTime(60) // Start from 1 minute
                            .setDuration(duration)
                            .outputOptions([
                            '-c:v libx264',
                            '-c:a aac',
                            '-b:v 1000k',
                            '-b:a 128k',
                            '-preset fast',
                        ])
                            .output(outputPath)
                            .on('end', function () { return resolve(); })
                            .on('error', reject)
                            .run();
                    })];
            });
        });
    };
    /**
     * Extract audio track
     */
    EncoderService.prototype.extractAudio = function (inputPath, outputPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        (0, fluent_ffmpeg_1.default)(inputPath)
                            .outputOptions(['-vn', '-c:a libmp3lame', '-b:a 192k'])
                            .output(outputPath)
                            .on('end', function () { return resolve(); })
                            .on('error', reject)
                            .run();
                    })];
            });
        });
    };
    /**
     * Get job status
     */
    EncoderService.prototype.getJobStatus = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var job, state, progress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.encodingQueue.getJob(jobId)];
                    case 1:
                        job = _a.sent();
                        if (!job) {
                            return [2 /*return*/, { error: 'Job not found' }];
                        }
                        return [4 /*yield*/, job.getState()];
                    case 2:
                        state = _a.sent();
                        progress = job.progress();
                        return [2 /*return*/, {
                                jobId: job.id,
                                state: state,
                                progress: progress,
                                data: job.data,
                                finishedOn: job.finishedOn,
                                failedReason: job.failedReason,
                            }];
                }
            });
        });
    };
    /**
     * Clean up old files
     */
    EncoderService.prototype.cleanupFiles = function (directory_1) {
        return __awaiter(this, arguments, void 0, function (directory, olderThanDays) {
            var files, now, maxAge, _i, files_1, file, filePath, stats;
            if (olderThanDays === void 0) { olderThanDays = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.readdir(directory)];
                    case 1:
                        files = _a.sent();
                        now = Date.now();
                        maxAge = olderThanDays * 24 * 60 * 60 * 1000;
                        _i = 0, files_1 = files;
                        _a.label = 2;
                    case 2:
                        if (!(_i < files_1.length)) return [3 /*break*/, 6];
                        file = files_1[_i];
                        filePath = path.join(directory, file);
                        return [4 /*yield*/, fs.stat(filePath)];
                    case 3:
                        stats = _a.sent();
                        if (!(now - stats.mtimeMs > maxAge)) return [3 /*break*/, 5];
                        return [4 /*yield*/, fs.remove(filePath)];
                    case 4:
                        _a.sent();
                        console.log("Cleaned up old file: ".concat(filePath));
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    EncoderService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, bull_1.InjectQueue)('video-encoding')),
        __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService])
    ], EncoderService);
    return EncoderService;
}());
exports.EncoderService = EncoderService;
