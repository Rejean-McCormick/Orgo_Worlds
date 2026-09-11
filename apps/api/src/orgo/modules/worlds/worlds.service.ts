import { Inject, Injectable } from '@nestjs/common';
import { Prisma, WorldMembershipRole } from '@prisma/client';
import { Database, json, lock, Tx } from '../../platform/database';
import {
  DomainError,
  ExecutionContext,
  hash,
  requirePermission,
} from '../../platform/contracts';

export interface WorldRuntime {
  worldId: string;
  worldKey: string;
  worldTitle: string;
  worldReleaseId: string;
  worldReleaseNumber: number;
  worldRole?: WorldMembershipRole;
  worldStatus: string;
}

const MANAGE_ROLES = new Set<WorldMembershipRole>(['owner', 'maintainer']);

@Injectable()
export class WorldsService {
  constructor(@Inject(Database) private readonly db: Database) {}

  private async audit(
    tx: Tx,
    ctx: ExecutionContext,
    worldId: string,
    action: string,
    details: unknown,
    releaseId?: string,
  ) {
    await tx.worldAuditEvent.create({
      data: {
        organization_id: ctx.organizationId,
        world_id: worldId,
        release_id: releaseId,
        actor_user_id: ctx.actorUserId,
        action,
        details: json(details),
      },
    });
  }

  async ensureDefaultWorld(
    organizationId: string,
    actorUserId?: string | null,
  ) {
    const existing = await this.db.world.findFirst({
      where: { organization_id: organizationId, is_default: true },
      include: { current_release: true },
    });
    if (existing?.current_release) return existing;

    return this.db.$transaction(async (tx) => {
      await lock(tx, `world-default:${organizationId}`);
      const concurrent = await tx.world.findFirst({
        where: { organization_id: organizationId, is_default: true },
        include: { current_release: true },
      });
      if (concurrent?.current_release) return concurrent;

      const world = concurrent ??
        (await tx.world.create({
          data: {
            organization_id: organizationId,
            key: 'main',
            title: 'Main',
            description: 'Default Orgo World created for compatibility.',
            visibility: 'organization',
            is_default: true,
            created_by_user_id: actorUserId ?? null,
          },
        }));
      const release = await tx.worldRelease.create({
        data: {
          organization_id: organizationId,
          world_id: world.id,
          release_number: 1,
          status: 'current',
          label: 'Initial',
          config: {},
          content_hash: hash({ world: world.key, release: 1, config: {} }),
          created_by_user_id: actorUserId ?? null,
          promoted_at: new Date(),
        },
      });
      const updated = await tx.world.update({
        where: { id: world.id },
        data: { current_release_id: release.id },
        include: { current_release: true },
      });
      if (actorUserId)
        await tx.worldMembership.upsert({
          where: { world_id_user_id: { world_id: world.id, user_id: actorUserId } },
          create: {
            organization_id: organizationId,
            world_id: world.id,
            user_id: actorUserId,
            role: 'owner',
          },
          update: { is_active: true },
        });
      return updated;
    });
  }

  async resolve(
    ctx: ExecutionContext,
    requestedKey?: string | null,
    allowArchived = false,
  ): Promise<WorldRuntime> {
    let world = requestedKey
      ? await this.db.world.findUnique({
          where: {
            organization_id_key: {
              organization_id: ctx.organizationId,
              key: requestedKey,
            },
          },
          include: { current_release: true },
        })
      : await this.db.world.findFirst({
          where: { organization_id: ctx.organizationId, is_default: true },
          include: { current_release: true },
        });

    if (!world && !requestedKey)
      world = await this.ensureDefaultWorld(ctx.organizationId, ctx.actorUserId);
    if (!world)
      throw new DomainError('WORLD_NOT_FOUND', 'World not found', 404);
    if (world.status === 'archived' && !allowArchived)
      throw new DomainError('WORLD_ARCHIVED', 'World is archived', 409);
    if (!world.current_release)
      throw new DomainError(
        'WORLD_RELEASE_NOT_READY',
        'World has no current release',
        409,
      );

    const membership = ctx.actorUserId
      ? await this.db.worldMembership.findUnique({
          where: {
            world_id_user_id: { world_id: world.id, user_id: ctx.actorUserId },
          },
        })
      : null;
    const privileged = ctx.permissions.includes('*');
    if (
      world.visibility === 'private' &&
      !privileged &&
      !(membership?.is_active)
    )
      throw new DomainError('WORLD_ACCESS_DENIED', 'World access denied', 403);

    return {
      worldId: world.id,
      worldKey: world.key,
      worldTitle: world.title,
      worldReleaseId: world.current_release.id,
      worldReleaseNumber: world.current_release.release_number,
      worldRole: membership?.is_active ? membership.role : undefined,
      worldStatus: world.status,
    };
  }

  private async requireManage(ctx: ExecutionContext, worldId?: string) {
    if (ctx.permissions.includes('*')) return;
    // Creating a World is an organization-level capability. Once a World exists,
    // its owner/maintainer may administer it without being made a global Worlds admin.
    if (!worldId) {
      requirePermission(ctx, 'worlds:manage');
      return;
    }
    if (ctx.permissions.includes('worlds:manage')) return;
    if (!ctx.actorUserId)
      throw new DomainError('WORLD_MANAGE_DENIED', 'World management denied', 403);
    const membership = await this.db.worldMembership.findUnique({
      where: { world_id_user_id: { world_id: worldId, user_id: ctx.actorUserId } },
    });
    if (!membership?.is_active || !MANAGE_ROLES.has(membership.role))
      throw new DomainError('WORLD_MANAGE_DENIED', 'World management denied', 403);
  }

  async list(ctx: ExecutionContext) {
    const worlds = await this.db.world.findMany({
      where: {
        organization_id: ctx.organizationId,
        ...(ctx.permissions.includes('*')
          ? {}
          : {
              OR: [
                { visibility: 'organization' as const },
                ...(ctx.actorUserId
                  ? [{ memberships: { some: { user_id: ctx.actorUserId, is_active: true } } }]
                  : []),
              ],
            }),
      },
      include: {
        current_release: true,
        memberships: {
          where: {
            user_id: ctx.actorUserId ?? '00000000-0000-0000-0000-000000000000',
            is_active: true,
          },
          take: 1,
        },
        _count: { select: { tasks: true, cases: true, signals: true } },
      },
      orderBy: [{ is_default: 'desc' }, { title: 'asc' }],
    });
    return worlds.map((world) => ({
      id: world.id,
      key: world.key,
      title: world.title,
      description: world.description,
      status: world.status,
      visibility: world.visibility,
      is_default: world.is_default,
      current_release: world.current_release,
      role: world.memberships[0]?.role ?? null,
      counts: world._count,
    }));
  }

  async get(ctx: ExecutionContext, key: string) {
    const runtime = await this.resolve(ctx, key, true);
    const world = await this.db.world.findUniqueOrThrow({
      where: { id: runtime.worldId },
      include: {
        current_release: true,
        releases: { orderBy: { release_number: 'desc' } },
        _count: { select: { tasks: true, cases: true, signals: true, memberships: true } },
      },
    });
    return { ...world, role: runtime.worldRole ?? null, runtime, counts: world._count };
  }

  async create(
    ctx: ExecutionContext,
    input: { key: string; title: string; description?: string; visibility?: 'organization' | 'private' },
  ) {
    await this.requireManage(ctx);
    return this.db.$transaction(async (tx) => {
      const world = await tx.world.create({
        data: {
          organization_id: ctx.organizationId,
          key: input.key,
          title: input.title,
          description: input.description ?? '',
          visibility: input.visibility ?? 'private',
          created_by_user_id: ctx.actorUserId,
        },
      });
      const release = await tx.worldRelease.create({
        data: {
          organization_id: ctx.organizationId,
          world_id: world.id,
          release_number: 1,
          status: 'current',
          label: 'Initial',
          config: {},
          content_hash: hash({ world: world.key, release: 1, config: {} }),
          created_by_user_id: ctx.actorUserId,
          promoted_at: new Date(),
        },
      });
      await tx.world.update({
        where: { id: world.id },
        data: { current_release_id: release.id },
      });
      if (ctx.actorUserId)
        await tx.worldMembership.create({
          data: {
            organization_id: ctx.organizationId,
            world_id: world.id,
            user_id: ctx.actorUserId,
            role: 'owner',
          },
        });
      await this.audit(tx, ctx, world.id, 'WorldCreated', { key: world.key }, release.id);
      return tx.world.findUniqueOrThrow({
        where: { id: world.id },
        include: { current_release: true },
      });
    });
  }

  async releases(ctx: ExecutionContext, key: string) {
    const runtime = await this.resolve(ctx, key);
    return this.db.worldRelease.findMany({
      where: { organization_id: ctx.organizationId, world_id: runtime.worldId },
      orderBy: { release_number: 'desc' },
    });
  }

  async createRelease(
    ctx: ExecutionContext,
    key: string,
    input: { label?: string; config?: Record<string, unknown> },
  ) {
    const runtime = await this.resolve(ctx, key);
    await this.requireManage(ctx, runtime.worldId);
    return this.db.$transaction(async (tx) => {
      await lock(tx, `world-release:${runtime.worldId}`);
      const latest = await tx.worldRelease.findFirst({
        where: { world_id: runtime.worldId },
        orderBy: { release_number: 'desc' },
      });
      const releaseNumber = (latest?.release_number ?? 0) + 1;
      const config = input.config ?? {};
      const release = await tx.worldRelease.create({
        data: {
          organization_id: ctx.organizationId,
          world_id: runtime.worldId,
          release_number: releaseNumber,
          status: 'ready',
          label: input.label ?? `Release ${releaseNumber}`,
          config: json(config),
          content_hash: hash({ world: key, release: releaseNumber, config }),
          parent_release_id: runtime.worldReleaseId,
          created_by_user_id: ctx.actorUserId,
        },
      });
      await this.audit(tx, ctx, runtime.worldId, 'WorldReleaseCreated', {
        release_number: releaseNumber,
        content_hash: release.content_hash,
      }, release.id);
      return release;
    });
  }

  async promote(ctx: ExecutionContext, key: string, releaseId: string) {
    const runtime = await this.resolve(ctx, key);
    await this.requireManage(ctx, runtime.worldId);
    return this.db.$transaction(async (tx) => {
      await lock(tx, `world-release:${runtime.worldId}`);
      const target = await tx.worldRelease.findFirst({
        where: {
          id: releaseId,
          organization_id: ctx.organizationId,
          world_id: runtime.worldId,
        },
      });
      if (!target)
        throw new DomainError('WORLD_RELEASE_NOT_FOUND', 'World release not found', 404);
      if (!['ready', 'current'].includes(target.status))
        throw new DomainError('WORLD_RELEASE_NOT_READY', 'Release is not promotable', 409);
      if (target.status !== 'current') {
        await tx.worldRelease.updateMany({
          where: { world_id: runtime.worldId, status: 'current' },
          data: { status: 'ready' },
        });
        await tx.worldRelease.update({
          where: { id: target.id },
          data: { status: 'current', promoted_at: new Date() },
        });
        await tx.world.update({
          where: { id: runtime.worldId },
          data: { current_release_id: target.id },
        });
      }
      await this.audit(tx, ctx, runtime.worldId, 'WorldReleasePromoted', {
        release_number: target.release_number,
      }, target.id);
      return tx.worldRelease.findUniqueOrThrow({ where: { id: target.id } });
    });
  }

  async memberships(ctx: ExecutionContext, key: string) {
    const runtime = await this.resolve(ctx, key);
    await this.requireManage(ctx, runtime.worldId);
    return this.db.worldMembership.findMany({
      where: { world_id: runtime.worldId },
      include: { user: { select: { id: true, email: true, display_name: true, status: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  async setMembership(
    ctx: ExecutionContext,
    key: string,
    userId: string,
    input: { role: WorldMembershipRole; is_active?: boolean },
  ) {
    const runtime = await this.resolve(ctx, key);
    await this.requireManage(ctx, runtime.worldId);
    const user = await this.db.userAccount.findFirst({
      where: { id: userId, organization_id: ctx.organizationId },
    });
    if (!user) throw new DomainError('USER_NOT_FOUND', 'User not found', 404);
    const membership = await this.db.worldMembership.upsert({
      where: { world_id_user_id: { world_id: runtime.worldId, user_id: userId } },
      create: {
        organization_id: ctx.organizationId,
        world_id: runtime.worldId,
        user_id: userId,
        role: input.role,
        is_active: input.is_active ?? true,
      },
      update: { role: input.role, is_active: input.is_active ?? true },
    });
    await this.db.worldAuditEvent.create({
      data: {
        organization_id: ctx.organizationId,
        world_id: runtime.worldId,
        release_id: runtime.worldReleaseId,
        actor_user_id: ctx.actorUserId,
        action: 'WorldMembershipChanged',
        details: { user_id: userId, role: membership.role, is_active: membership.is_active },
      },
    });
    return membership;
  }

  async archive(ctx: ExecutionContext, key: string) {
    const runtime = await this.resolve(ctx, key);
    await this.requireManage(ctx, runtime.worldId);
    if (key === 'main')
      throw new DomainError('DEFAULT_WORLD_REQUIRED', 'The main World cannot be archived', 409);
    const world = await this.db.world.update({
      where: { id: runtime.worldId },
      data: { status: 'archived', archived_at: new Date() },
    });
    await this.db.worldAuditEvent.create({
      data: {
        organization_id: ctx.organizationId,
        world_id: runtime.worldId,
        release_id: runtime.worldReleaseId,
        actor_user_id: ctx.actorUserId,
        action: 'WorldArchived',
        details: {},
      },
    });
    return world;
  }
}
