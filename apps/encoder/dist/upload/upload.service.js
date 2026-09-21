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
exports.UploadService = void 0;
var common_1 = require("@nestjs/common");
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var prisma_service_1 = require("../prisma/prisma.service");
var UploadService = /** @class */ (function () {
    function UploadService(prisma) {
        this.prisma = prisma;
        this.uploadDir = process.env.UPLOAD_DIR || './uploads';
        this.videoDir = path.join(this.uploadDir, 'videos');
        this.imageDir = path.join(this.uploadDir, 'images');
        this.ensureDirectories();
    }
    UploadService.prototype.ensureDirectories = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.ensureDir(this.videoDir)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, fs.ensureDir(this.imageDir)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Save uploaded video file
     */
    UploadService.prototype.saveVideo = function (file, contentId) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, ext, filename, filepath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = Date.now();
                        ext = path.extname(file.originalname);
                        filename = "".concat(contentId, "_").concat(timestamp).concat(ext);
                        filepath = path.join(this.videoDir, filename);
                        return [4 /*yield*/, fs.writeFile(filepath, file.buffer)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, filepath];
                }
            });
        });
    };
    /**
     * Save uploaded image file
     */
    UploadService.prototype.saveImage = function (file, contentId) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, ext, filename, filepath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = Date.now();
                        ext = path.extname(file.originalname);
                        filename = "".concat(contentId, "_").concat(timestamp).concat(ext);
                        filepath = path.join(this.imageDir, filename);
                        return [4 /*yield*/, fs.writeFile(filepath, file.buffer)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, filepath];
                }
            });
        });
    };
    /**
     * Get file size
     */
    UploadService.prototype.getFileSize = function (filepath) {
        return __awaiter(this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.stat(filepath)];
                    case 1:
                        stats = _a.sent();
                        return [2 /*return*/, stats.size];
                }
            });
        });
    };
    /**
     * Delete file
     */
    UploadService.prototype.deleteFile = function (filepath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.remove(filepath)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get disk usage
     */
    UploadService.prototype.getDiskUsage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, totalSize, _i, files_1, file, filepath, stats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.readdir(this.uploadDir, { withFileTypes: true })];
                    case 1:
                        files = _a.sent();
                        totalSize = 0;
                        _i = 0, files_1 = files;
                        _a.label = 2;
                    case 2:
                        if (!(_i < files_1.length)) return [3 /*break*/, 5];
                        file = files_1[_i];
                        if (!file.isFile()) return [3 /*break*/, 4];
                        filepath = path.join(this.uploadDir, file.name);
                        return [4 /*yield*/, fs.stat(filepath)];
                    case 3:
                        stats = _a.sent();
                        totalSize += stats.size;
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, {
                            total: 0, // Would need OS-level call
                            used: totalSize,
                            free: 0, // Would need OS-level call
                        }];
                }
            });
        });
    };
    UploadService = __decorate([
        (0, common_1.Injectable)(),
        __metadata("design:paramtypes", [prisma_service_1.PrismaService])
    ], UploadService);
    return UploadService;
}());
exports.UploadService = UploadService;
