import { Module } from '@nestjs/common';
import { PlatformModule } from '../../platform/platform.module';
import { WorldsService } from './worlds.service';

@Module({
  imports: [PlatformModule],
  providers: [WorldsService],
  exports: [WorldsService],
})
export class WorldsModule {}
