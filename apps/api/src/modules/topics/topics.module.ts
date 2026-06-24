import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'research-queue' },
      { name: 'blog-gen-queue' },
      { name: 'evaluation-queue' },
    ),
  ],
  providers: [TopicsService],
  controllers: [TopicsController],
  exports: [TopicsService],
})
export class TopicsModule {}
