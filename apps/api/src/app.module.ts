import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TopicsModule } from './modules/topics/topics.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PublisherModule } from './modules/publisher/publisher.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { QueueModule } from './modules/queue/queue.module';
import { WorkersModule } from './workers/workers.module';

// Guards
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // Config — global so all modules can inject ConfigService
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database (Prisma) — global provider
    PrismaModule,

    // Queue (Redis/BullMQ) — global
    QueueModule,

    // Background workers
    WorkersModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TopicsModule,
    BlogsModule,
    PlaylistsModule,
    AnalyticsModule,
    PublisherModule,
    SchedulesModule,
  ],
  providers: [
    // Apply JWT guard globally; @Public() decorator bypasses it
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
