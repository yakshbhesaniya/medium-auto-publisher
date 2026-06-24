import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';


@Module({
  imports: [

    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: 'publish-queue' }),
  ],
  providers: [SchedulesService],
  controllers: [SchedulesController],
  exports: [SchedulesService],
})
export class SchedulesModule {}
