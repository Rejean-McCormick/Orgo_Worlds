import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { Commands } from '../../../platform/database';
import { ExecutionContext, parse } from '../../../platform/contracts';
import { Ctx } from './boundary';
import { InteractionKernelService } from '../../../modules/interaction-kernel/interaction-kernel.service';
import { z } from 'zod';

const artifactQuery = z
  .object({
    subject_type: z.enum(['case', 'task']),
    subject_id: z.string().uuid(),
  })
  .strict();
const recordId = z.string().min(1).max(500);

@Controller('ik')
export class InteractionKernelController {
  constructor(
    @Inject(InteractionKernelService)
    private readonly ik: InteractionKernelService,
    @Inject(Commands) private readonly commands: Commands,
  ) {}

  @Post('interactions')
  receive(@Ctx() ctx: ExecutionContext, @Body() body: unknown) {
    return this.ik.receive(ctx, body);
  }

  @Post('exports')
  exportManifest(@Ctx() ctx: ExecutionContext, @Body() body: unknown) {
    return this.ik.exportManifest(ctx, body);
  }

  @Post('artifact-links')
  linkArtifact(@Ctx() ctx: ExecutionContext, @Body() body: unknown) {
    return this.commands.run(ctx, 'ik.artifact-link', body, (tx) =>
      this.ik.linkArtifact(ctx, body, tx),
    );
  }

  @Get('artifact-links')
  listArtifactLinks(@Ctx() ctx: ExecutionContext, @Query() query: unknown) {
    return this.ik.listArtifactLinks(ctx, parse(artifactQuery, query));
  }

  @Post('build-records')
  createBuild(@Ctx() ctx: ExecutionContext, @Body() body: unknown) {
    return this.commands.run(ctx, 'ik.build-record', body, (tx) =>
      this.ik.createBuildRecord(ctx, body, tx),
    );
  }

  @Get('build-records/:id')
  getBuild(@Ctx() ctx: ExecutionContext, @Param('id') id: string) {
    return this.ik.getBuildRecord(ctx, parse(recordId, id));
  }

  @Post('release-records')
  createRelease(@Ctx() ctx: ExecutionContext, @Body() body: unknown) {
    return this.commands.run(ctx, 'ik.release-record', body, (tx) =>
      this.ik.appendReleaseRecord(ctx, body, tx),
    );
  }

  @Get('release-records/:id')
  getRelease(@Ctx() ctx: ExecutionContext, @Param('id') id: string) {
    return this.ik.getReleaseRecord(ctx, parse(recordId, id));
  }
}
