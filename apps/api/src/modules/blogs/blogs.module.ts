import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';


@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'blog-gen-queue' },
      { name: 'publish-queue' },
    ),
  ],
  providers: [BlogsService],
  controllers: [BlogsController],
  exports: [BlogsService],
})
export class BlogsModule {}
