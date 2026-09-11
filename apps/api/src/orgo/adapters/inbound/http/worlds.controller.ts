import { Body, Controller, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { ExecutionContext, parse, uuid } from '../../../platform/contracts';
import { WorldsService } from '../../../modules/worlds/worlds.service';
import { Ctx } from './boundary';

const keySchema = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/);
const createSchema = z.object({
  key: keySchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  visibility: z.enum(['organization', 'private']).optional(),
}).strict();
const releaseSchema = z.object({
  label: z.string().trim().max(200).optional(),
  config: z.record(z.unknown()).optional(),
}).strict();
const membershipSchema = z.object({
  role: z.enum(['owner', 'maintainer', 'member', 'viewer']),
  is_active: z.boolean().optional(),
}).strict();

@Controller('control/worlds')
export class WorldsController {
  constructor(@Inject(WorldsService) private readonly worlds: WorldsService) {}

  @Get()
  list(@Ctx() ctx: ExecutionContext) {
    return this.worlds.list(ctx);
  }

  @Post()
  create(@Ctx() ctx: ExecutionContext, @Body() body: unknown) {
    return this.worlds.create(ctx, parse(createSchema, body));
  }

  @Get(':key')
  get(@Ctx() ctx: ExecutionContext, @Param('key') raw: string) {
    return this.worlds.get(ctx, parse(keySchema, raw));
  }

  @Get(':key/releases')
  releases(@Ctx() ctx: ExecutionContext, @Param('key') raw: string) {
    return this.worlds.releases(ctx, parse(keySchema, raw));
  }

  @Post(':key/releases')
  createRelease(
    @Ctx() ctx: ExecutionContext,
    @Param('key') raw: string,
    @Body() body: unknown,
  ) {
    return this.worlds.createRelease(ctx, parse(keySchema, raw), parse(releaseSchema, body));
  }

  @Post(':key/releases/:releaseId/promote')
  promote(
    @Ctx() ctx: ExecutionContext,
    @Param('key') raw: string,
    @Param('releaseId') releaseId: string,
  ) {
    return this.worlds.promote(ctx, parse(keySchema, raw), parse(uuid, releaseId));
  }

  @Get(':key/memberships')
  memberships(@Ctx() ctx: ExecutionContext, @Param('key') raw: string) {
    return this.worlds.memberships(ctx, parse(keySchema, raw));
  }

  @Put(':key/memberships/:userId')
  membership(
    @Ctx() ctx: ExecutionContext,
    @Param('key') raw: string,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    return this.worlds.setMembership(
      ctx,
      parse(keySchema, raw),
      parse(uuid, userId),
      parse(membershipSchema, body),
    );
  }

  @Post(':key/archive')
  archive(@Ctx() ctx: ExecutionContext, @Param('key') raw: string) {
    return this.worlds.archive(ctx, parse(keySchema, raw));
  }
}

@Controller('runtime')
export class WorldRuntimeController {
  @Get()
  runtime(@Ctx() ctx: ExecutionContext) {
    return {
      world: {
        id: ctx.worldId,
        key: ctx.worldKey,
        title: ctx.worldTitle,
        role: ctx.worldRole ?? null,
        status: ctx.worldStatus,
      },
      release: {
        id: ctx.worldReleaseId,
        number: ctx.worldReleaseNumber,
      },
    };
  }
}
