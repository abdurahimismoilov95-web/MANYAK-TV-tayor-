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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpisodesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EpisodesService = class EpisodesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const content = await this.prisma.content.findUnique({
            where: { id: data.contentId },
        });
        if (!content) {
            throw new common_1.NotFoundException('Content not found');
        }
        return this.prisma.episode.create({ data });
    }
    async findByContent(contentId) {
        return this.prisma.episode.findMany({
            where: { contentId },
            orderBy: [
                { seasonNumber: 'asc' },
                { episodeNumber: 'asc' },
            ],
        });
    }
    async findOne(id) {
        const episode = await this.prisma.episode.findUnique({
            where: { id },
            include: { content: true },
        });
        if (!episode) {
            throw new common_1.NotFoundException('Episode not found');
        }
        return episode;
    }
    async update(id, data) {
        return this.prisma.episode.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        return this.prisma.episode.delete({ where: { id } });
    }
    async incrementViews(id) {
        return this.prisma.episode.update({
            where: { id },
            data: {
                viewsCount: { increment: 1 },
            },
        });
    }
};
exports.EpisodesService = EpisodesService;
exports.EpisodesService = EpisodesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EpisodesService);
//# sourceMappingURL=episodes.service.js.map