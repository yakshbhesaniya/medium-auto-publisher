import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { ResearchWorker } from './research.worker';
import { BlogGenWorker } from './blog-gen.worker';
import { PublishWorker } from './publish.worker';
import { PublisherModule } from '../modules/publisher/publisher.module';

@Module({
  imports: [
    PublisherModule,
    BullModule.registerQueue(
      { name: 'research-queue' },
      { name: 'blog-gen-queue' },
      { name: 'publish-queue' },
    ),
  ],
  providers: [ResearchWorker, BlogGenWorker, PublishWorker],
})
export class WorkersModule {}
