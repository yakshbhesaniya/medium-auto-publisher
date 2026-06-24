import { Module } from '@nestjs/common';
import { PublisherService } from './publisher.service';
import { PublisherController } from './publisher.controller';

import { UsersModule } from '../users/users.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [UsersModule, AnalyticsModule],
  providers: [PublisherService],
  controllers: [PublisherController],
  exports: [PublisherService],
})
export class PublisherModule {}
