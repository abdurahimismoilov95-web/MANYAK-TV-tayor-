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
exports.ThumbnailService = void 0;
var common_1 = require("@nestjs/common");
var fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
var sharp_1 = __importDefault(require("sharp"));
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var ThumbnailService = /** @class */ (function () {
    function ThumbnailService() {
    }
    /**
     * Generate thumbnail from video at specific timestamp
     */
    ThumbnailService.prototype.generateFromVideo = function (videoPath_1, outputPath_1) {
        return __awaiter(this, arguments, void 0, function (videoPath, outputPath, timestamp) {
            if (timestamp === void 0) { timestamp = '00:00:05'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.ensureDir(path.dirname(outputPath))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                (0, fluent_ffmpeg_1.default)(videoPath)
                                    .screenshots({
                                    timestamps: [timestamp],
                                    filename: path.basename(outputPath),
                                    folder: path.dirname(outputPath),
                                    size: '1280x720',
                                })
                                    .on('end', function () {
                                    console.log("Thumbnail generated: ".concat(outputPath));
                                    resolve();
                                })
                                    .on('error', function (err) {
                                    console.error('Thumbnail generation error:', err);
                                    reject(err);
                                });
                            })];
                }
            });
        });
    };
    /**
     * Generate multiple thumbnails (sprite sheet)
     */
    ThumbnailService.prototype.generateSpriteSheet = function (videoPath_1, outputDir_1) {
        return __awaiter(this, arguments, void 0, function (videoPath, outputDir, count) {
            var metadata, duration, interval, timestamps, i, time, minutes, seconds, outputPaths, i, outputPath;
            if (count === void 0) { count = 12; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.ensureDir(outputDir)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                fluent_ffmpeg_1.default.ffprobe(videoPath, function (err, data) {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve(data);
                                });
                            })];
                    case 2:
                        metadata = _a.sent();
                        duration = metadata.format.duration;
                        interval = duration / count;
                        timestamps = [];
                        for (i = 1; i <= count; i++) {
                            time = interval * i;
                            minutes = Math.floor(time / 60);
                            seconds = Math.floor(time % 60);
                            timestamps.push("00:".concat(minutes.toString().padStart(2, '0'), ":").concat(seconds.toString().padStart(2, '0')));
                        }
                        outputPaths = [];
                        i = 0;
                        _a.label = 3;
                    case 3:
                        if (!(i < timestamps.length)) return [3 /*break*/, 6];
                        outputPath = path.join(outputDir, "thumb_".concat(i + 1, ".jpg"));
                        return [4 /*yield*/, this.generateFromVideo(videoPath, outputPath, timestamps[i])];
                    case 4:
                        _a.sent();
                        outputPaths.push(outputPath);
                        _a.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, outputPaths];
                }
            });
        });
    };
    /**
     * Optimize/resize image using Sharp
     */
    ThumbnailService.prototype.optimizeImage = function (inputPath_1, outputPath_1) {
        return __awaiter(this, arguments, void 0, function (inputPath, outputPath, width, quality) {
            if (width === void 0) { width = 1280; }
            if (quality === void 0) { quality = 80; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, sharp_1.default)(inputPath)
                            .resize(width, null, { fit: 'inside', withoutEnlargement: true })
                            .jpeg({ quality: quality })
                            .toFile(outputPath)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate multiple sizes of thumbnail
     */
    ThumbnailService.prototype.generateMultipleSizes = function (inputPath, outputDir) {
        return __awaiter(this, void 0, void 0, function () {
            var sizes, outputs, _i, _a, _b, key, width, outputPath;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, fs.ensureDir(outputDir)];
                    case 1:
                        _c.sent();
                        sizes = {
                            small: 320,
                            medium: 640,
                            large: 1280,
                        };
                        outputs = {};
                        _i = 0, _a = Object.entries(sizes);
                        _c.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        _b = _a[_i], key = _b[0], width = _b[1];
                        outputPath = path.join(outputDir, "thumbnail_".concat(key, ".jpg"));
                        return [4 /*yield*/, this.optimizeImage(inputPath, outputPath, width)];
                    case 3:
                        _c.sent();
                        outputs[key] = outputPath;
                        _c.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, outputs];
                }
            });
        });
    };
    /**
     * Generate poster image (for video player)
     */
    ThumbnailService.prototype.generatePoster = function (videoPath, outputPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Generate at 10% of video duration
                    return [4 /*yield*/, this.generateFromVideo(videoPath, outputPath, '10%')];
                    case 1:
                        // Generate at 10% of video duration
                        _a.sent();
                        // Optimize
                        return [4 /*yield*/, this.optimizeImage(outputPath, outputPath, 1920, 85)];
                    case 2:
                        // Optimize
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ThumbnailService = __decorate([
        (0, common_1.Injectable)()
    ], ThumbnailService);
    return ThumbnailService;
}());
exports.ThumbnailService = ThumbnailService;
