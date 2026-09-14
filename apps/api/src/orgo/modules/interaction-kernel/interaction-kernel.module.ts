import { Module } from '@nestjs/common';
import { IntakeModule } from '../intake/intake.module';
import { WorkModule } from '../work/work.module';
import { InteractionKernelController } from '../../adapters/inbound/http/interaction-kernel.controller';
import { InteractionKernelService } from './interaction-kernel.service';

@Module({
  imports: [IntakeModule, WorkModule],
  controllers: [InteractionKernelController],
  providers: [InteractionKernelService],
  exports: [InteractionKernelService],
})
export class InteractionKernelModule {}
