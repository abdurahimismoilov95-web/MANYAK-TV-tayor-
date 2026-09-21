import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { CategoriesService } from './categories.service';
import { EpisodesService } from './episodes.service';

@Module({
  controllers: [ContentController],
  providers: [ContentService, CategoriesService, EpisodesService],
  exports: [ContentService],
})
export class ContentModule {}
