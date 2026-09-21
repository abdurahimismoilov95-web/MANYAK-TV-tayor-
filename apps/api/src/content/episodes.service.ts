import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateEpisodeDto {
  contentId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  quality: string[];
}

@Injectable()
export class EpisodesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEpisodeDto) {
    const content = await this.prisma.content.findUnique({
      where: { id: data.contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return this.prisma.episode.create({ data });
  }

  async findByContent(contentId: string) {
    return this.prisma.episode.findMany({
      where: { contentId },
      orderBy: [
        { seasonNumber: 'asc' },
        { episodeNumber: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id },
      include: { content: true },
    });

    if (!episode) {
      throw new NotFoundException('Episode not found');
    }

    return episode;
  }

  async update(id: string, data: Partial<CreateEpisodeDto>) {
    return this.prisma.episode.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.episode.delete({ where: { id } });
  }

  async incrementViews(id: string) {
    return this.prisma.episode.update({
      where: { id },
      data: {
        viewsCount: { increment: 1 },
      },
    });
  }
}
