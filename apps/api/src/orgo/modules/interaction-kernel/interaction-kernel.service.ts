import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  Database,
  json,
  lock,
  recordEvent,
  Tx,
} from '../../platform/database';
import {
  DomainError,
  ExecutionContext,
  parse,
  requirePermission,
  worldScope,
} from '../../platform/contracts';
import { IntakeService } from '../intake/intake.service';
import { WorkService } from '../work/public';
import {
  artifactLinkInput,
  buildRecordInput,
  decisionExecuteData,
  decisionRouteConfig,
  ikReceipt,
  ikRequestFingerprint,
  ikSemanticProjection,
  ikSha256,
  interactionEnvelope,
  releaseRecordInput,
  type InteractionEnvelope,
} from '../../integrations/interaction-kernel/contracts';

const exportRequest = z
  .object({
    subject_type: z.enum(['case', 'task']),
    subject_id: z.string().uuid(),
  })
  .strict();

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

@Injectable()
export class InteractionKernelService {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(IntakeService) private readonly intake: IntakeService,
    @Inject(WorkService) private readonly work: WorkService,
  ) {}

  private validateDecisionEnvelope(ctx: ExecutionContext, raw: unknown) {
    const envelope = parse(interactionEnvelope, raw);
    if (
      envelope.class !== 'command' ||
      envelope.profile.id !== 'governance.decision.execute' ||
      envelope.profile.version !== '1.0.0'
    )
      throw new DomainError(
        'IK_UNKNOWN_PROFILE',
        'Only governance.decision.execute/1.0.0 is accepted on this boundary',
        422,
      );
    if (envelope.source.system !== 'konnaxion')
      throw new DomainError('IK_UNAUTHORIZED', 'Konnaxion source required', 403);
    if (
      envelope.source.organization &&
      envelope.source.organization !== ctx.organizationId
    )
      throw new DomainError(
        'IK_UNAUTHORIZED',
        'Source organization does not match authenticated tenant',
        403,
      );
    if (envelope.subject.type !== 'decision')
      throw new DomainError(
        'IK_INVALID_ENVELOPE',
        'governance.decision.execute requires subject.type=decision',
        422,
      );
    if (envelope.target?.system !== 'orgo')
      throw new DomainError('IK_TARGET_NOT_FOUND', 'Orgo target required', 422);
    if (
      envelope.target.organization &&
      envelope.target.organization !== ctx.organizationId
    )
      throw new DomainError(
        'IK_TARGET_NOT_FOUND',
        'Target organization does not match authenticated tenant',
        404,
      );
    if (
      envelope.target.world &&
      envelope.target.world !== ctx.worldKey &&
      envelope.target.world !== ctx.worldId
    )
      throw new DomainError(
        'IK_TARGET_NOT_FOUND',
        'Target World does not match authenticated World',
        404,
      );
    if (
      envelope.target.release &&
      envelope.target.release !== ctx.worldReleaseId &&
      envelope.target.release !== String(ctx.worldReleaseNumber)
    )
      throw new DomainError(
        'IK_TARGET_NOT_READY',
        'Target release does not match the active World release',
        409,
      );
    if (!envelope.idempotency_key)
      throw new DomainError(
        'IK_INVALID_ENVELOPE',
        'idempotency_key is required',
        400,
      );
    if (
      ctx.idempotencyKey &&
      ctx.idempotencyKey !== envelope.idempotency_key
    )
      throw new DomainError(
        'IK_IDEMPOTENCY_CONFLICT',
        'Idempotency-Key header must equal envelope.idempotency_key',
        409,
      );
    if (envelope.authority?.kind !== 'governance-mandate')
      throw new DomainError(
        'IK_UNAUTHORIZED',
        'governance-mandate authority is required',
        403,
      );
    if (
      !envelope.artifact_refs.some(
        (ref) =>
          ref.owner.system === 'konnaxion' &&
          (!ref.owner.organization || ref.owner.organization === ctx.organizationId) &&
          ref.artifact_type === 'konnaxion.decision_record',
      )
    )
      throw new DomainError(
        'IK_INVALID_ENVELOPE',
        'A Konnaxion DecisionRecord ArtifactRef is required',
        422,
      );
    return {
      envelope,
      data: parse(decisionExecuteData, envelope.data ?? {}),
    };
  }

  private async route(
    ctx: ExecutionContext,
    tx: Tx,
  ) {
    const scope = worldScope(ctx);
    const release = await tx.worldRelease.findFirst({
      where: {
        id: scope.world_release_id,
        organization_id: ctx.organizationId,
        world_id: scope.world_id,
      },
    });
    if (!release)
      throw new DomainError(
        'IK_TARGET_NOT_READY',
        'Current World release is unavailable',
        409,
      );
    const config = object(release.config);
    const ik = object(config.interaction_kernel);
    const rawRoute = ik.decision_execute;
    if (!rawRoute)
      throw new DomainError(
        'IK_TARGET_NOT_READY',
        'World release does not configure interaction_kernel.decision_execute',
        409,
      );
    const route = parse(decisionRouteConfig, rawRoute);
    const definition = await tx.workflowDefinition.findUnique({
      where: {
        organization_id_world_id_code: {
          organization_id: ctx.organizationId,
          world_id: scope.world_id,
          code: route.workflow_code,
        },
      },
    });
    if (!definition || !definition.is_active)
      throw new DomainError(
        'IK_TARGET_NOT_READY',
        `Workflow ${route.workflow_code} is not active in this World`,
        409,
      );
    const version = await tx.workflowVersion.findFirst({
      where: {
        workflow_definition_id: definition.id,
        world_release_id: scope.world_release_id,
      },
      orderBy: { version: 'desc' },
    });
    if (!version)
      throw new DomainError(
        'IK_TARGET_NOT_READY',
        `Workflow ${route.workflow_code} is not pinned to the current World release`,
        409,
      );
    return { route, version };
  }

  async receive(ctx: ExecutionContext, raw: unknown) {
    requirePermission(ctx, 'signals:write');
    requirePermission(ctx, 'workflows:execute');
    const { envelope, data } = this.validateDecisionEnvelope(ctx, raw);
    const fingerprint = ikRequestFingerprint(envelope);
    const internalCtx: ExecutionContext = {
      ...ctx,
      idempotencyKey: envelope.idempotency_key!,
      correlationId: envelope.correlation_id ?? ctx.correlationId,
      causationId: envelope.id,
      source: 'api',
    };
    const operation = `${envelope.profile.id}@${envelope.profile.version}`;
    return this.db.$transaction(
      async (tx) => {
        const scope = worldScope(internalCtx);
        await lock(
          tx,
          `${internalCtx.organizationId}:${scope.world_id}:ik:${operation}:${envelope.idempotency_key}`,
        );
        const where = {
          organization_id_world_id_operation_key: {
            organization_id: internalCtx.organizationId,
            world_id: scope.world_id,
            operation,
            key: envelope.idempotency_key!,
          },
        };
        const existing = await tx.idempotencyRecord.findUnique({ where });
        if (existing) {
          if (existing.request_hash !== fingerprint)
            throw new DomainError(
              'IK_IDEMPOTENCY_CONFLICT',
              'Same idempotency identity contains a divergent semantic request',
              409,
            );
          return existing.response;
        }
        const { route, version } = await this.route(internalCtx, tx);
        const signal = await this.intake.accept(
          internalCtx,
          {
            source: 'api',
            external_reference: `ik:konnaxion:decision:${envelope.subject.id}:${data.decision_revision}`,
            type: route.type,
            category: route.category,
            severity: route.severity,
            label: route.label,
            title: `${route.title_prefix} ${envelope.subject.id}`,
            description: `Konnaxion DecisionRecord ${envelope.subject.id}, revision ${data.decision_revision}`,
            payload: {
              interaction_kernel: {
                interaction_id: envelope.id,
                profile: envelope.profile,
                source: envelope.source,
                authority: envelope.authority,
                request_fingerprint: fingerprint,
                fingerprint_profile:
                  'ik.request-fingerprint/jcs-rfc8785+sha256/v1',
                decision_revision: data.decision_revision,
                effective_at: data.effective_at ?? null,
                execution_scope: data.execution_scope ?? null,
                artifact_refs: envelope.artifact_refs,
              },
            },
            workflow_version_id: version.id,
          },
          tx,
        );
        const receipt = ikReceipt({
          interactionId: envelope.id,
          organizationId: internalCtx.organizationId,
          correlationId: internalCtx.correlationId,
          status: 'accepted',
          externalReference: signal.id,
          data: {
            signal_id: signal.id,
            workflow_version_id: version.id,
            request_fingerprint: fingerprint,
          },
        });
        await tx.idempotencyRecord.create({
          data: {
            organization_id: internalCtx.organizationId,
            ...scope,
            operation,
            key: envelope.idempotency_key!,
            request_hash: fingerprint,
            response: json(receipt),
          },
        });
        await recordEvent(tx, internalCtx, 'signal', signal.id, 'IkCommandAccepted', {
          interaction_id: envelope.id,
          profile: envelope.profile,
          request_fingerprint: fingerprint,
        });
        return receipt;
      },
      { timeout: 20000, maxWait: 10000 },
    );
  }

  async exportManifest(ctx: ExecutionContext, raw: unknown) {
    requirePermission(ctx, 'integrations:read');
    const input = parse(exportRequest, raw);
    const row =
      input.subject_type === 'case'
        ? await this.work.getCase(ctx, input.subject_id)
        : await this.work.getTask(ctx, input.subject_id);
    const snapshot = JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
    const digest = `sha256:${ikSha256(snapshot)}`;
    const updated =
      typeof snapshot.updated_at === 'string'
        ? snapshot.updated_at
        : new Date().toISOString();
    const body = {
      id: `orgo-export:${input.subject_type}:${input.subject_id}:${digest.slice(7, 23)}`,
      profile: 'orgo.export/1.0.0',
      producer: { system: 'orgo', organization: ctx.organizationId },
      snapshot_at: new Date().toISOString(),
      source_revision: updated,
      scope: {
        organization: ctx.organizationId,
        world: ctx.worldKey ?? ctx.worldId,
        release: ctx.worldReleaseId,
      },
      subjects: [{ type: input.subject_type, id: input.subject_id }],
      items: [
        {
          type: `orgo.${input.subject_type}_projection`,
          ref: `orgo://${input.subject_type}/${input.subject_id}@${encodeURIComponent(updated)}`,
          digest,
        },
      ],
      intended_use: ['kristal_compilation'],
      provenance: {
        world_release_id: ctx.worldReleaseId,
        correlation_id: ctx.correlationId,
      },
    };
    return {
      ...body,
      integrity: { algorithm: 'sha256', digest: `sha256:${ikSha256(body)}` },
    };
  }

  async linkArtifact(ctx: ExecutionContext, raw: unknown, tx: Tx) {
    requirePermission(ctx, 'integrations:write');
    const input = parse(artifactLinkInput, raw);
    if (input.subject_type === 'case')
      await this.work.getCase(ctx, input.subject_id, tx);
    else await this.work.getTask(ctx, input.subject_id, tx);
    const scope = worldScope(ctx);
    const digest = input.artifact.integrity?.digest ?? null;
    const existing = await tx.artifactLink.findFirst({
      where: {
        organization_id: ctx.organizationId,
        world_id: scope.world_id,
        subject_type: input.subject_type,
        subject_id: input.subject_id,
        relation: input.relation,
        artifact_owner: input.artifact.owner.system,
        artifact_owner_organization: input.artifact.owner.organization ?? '',
        artifact_owner_instance: input.artifact.owner.instance ?? '',
        artifact_type: input.artifact.artifact_type,
        artifact_id: input.artifact.artifact_id,
        artifact_version: input.artifact.version ?? '',
      },
    });
    if (existing) {
      if (existing.digest !== digest)
        throw new DomainError(
          'IK_ARTIFACT_LINK_CONFLICT',
          'Artifact identity is already linked with different integrity metadata',
          409,
        );
      return existing;
    }
    const row = await tx.artifactLink.create({
      data: {
        organization_id: ctx.organizationId,
        ...scope,
        subject_type: input.subject_type,
        subject_id: input.subject_id,
        relation: input.relation,
        artifact_owner: input.artifact.owner.system,
        artifact_owner_organization: input.artifact.owner.organization ?? '',
        artifact_owner_instance: input.artifact.owner.instance ?? '',
        artifact_type: input.artifact.artifact_type,
        artifact_id: input.artifact.artifact_id,
        artifact_version: input.artifact.version ?? '',
        digest,
        locator: input.artifact.locator?.ref ?? null,
        metadata: json({
          content: input.artifact.content ?? null,
          scope: input.artifact.scope ?? null,
          provenance: input.artifact.provenance ?? null,
          access: input.artifact.access ?? null,
          ...input.metadata,
        }),
      },
    });
    await recordEvent(tx, ctx, input.subject_type, input.subject_id, 'ArtifactLinked', {
      artifact_link_id: row.id,
      artifact_owner: row.artifact_owner,
      artifact_type: row.artifact_type,
      artifact_id: row.artifact_id,
      relation: row.relation,
    });
    return row;
  }

  async listArtifactLinks(
    ctx: ExecutionContext,
    raw: unknown,
  ) {
    requirePermission(ctx, 'integrations:read');
    const input = parse(exportRequest, raw);
    if (input.subject_type === 'case') await this.work.getCase(ctx, input.subject_id);
    else await this.work.getTask(ctx, input.subject_id);
    return this.db.artifactLink.findMany({
      where: {
        organization_id: ctx.organizationId,
        world_id: worldScope(ctx).world_id,
        subject_type: input.subject_type,
        subject_id: input.subject_id,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async createBuildRecord(ctx: ExecutionContext, raw: unknown, tx: Tx) {
    requirePermission(ctx, 'integrations:write');
    const input = parse(buildRecordInput, raw);
    const digest = ikSha256(input);
    const scope = worldScope(ctx);
    await lock(tx, `${ctx.organizationId}:${scope.world_id}:build:${input.build_id}`);
    const existing = await tx.buildRecord.findFirst({
      where: {
        organization_id: ctx.organizationId,
        world_id: scope.world_id,
        build_id: input.build_id,
      },
    });
    if (existing) {
      if (existing.record_hash !== digest)
        throw new DomainError(
          'IK_BUILD_RECORD_CONFLICT',
          'BuildRecord is immutable and already exists with different content',
          409,
        );
      return existing;
    }
    const row = await tx.buildRecord.create({
      data: {
        organization_id: ctx.organizationId,
        ...scope,
        build_id: input.build_id,
        status: input.stages.some((stage) =>
          ['FAIL', 'ERROR'].includes(stage.status),
        )
          ? 'RECORDED_WITH_STAGE_FAILURES'
          : 'RECORDED',
        record: json(input),
        record_hash: digest,
      },
    });
    await recordEvent(tx, ctx, 'build_record', row.id, 'BuildRecordCreated', {
      build_id: row.build_id,
      status: row.status,
      record_hash: row.record_hash,
    });
    return row;
  }

  async getBuildRecord(ctx: ExecutionContext, buildId: string) {
    requirePermission(ctx, 'integrations:read');
    const row = await this.db.buildRecord.findFirst({
      where: {
        organization_id: ctx.organizationId,
        world_id: worldScope(ctx).world_id,
        build_id: buildId,
      },
    });
    if (!row) throw new DomainError('NOT_FOUND', 'BuildRecord not found', 404);
    return row;
  }

  async appendReleaseRecord(ctx: ExecutionContext, raw: unknown, tx: Tx) {
    requirePermission(ctx, 'integrations:write');
    const input = parse(releaseRecordInput, raw);
    const scope = worldScope(ctx);
    await lock(tx, `${ctx.organizationId}:${scope.world_id}:release:${input.release_id}`);
    const latest = await tx.releaseRecord.findFirst({
      where: {
        organization_id: ctx.organizationId,
        world_id: scope.world_id,
        release_id: input.release_id,
      },
      orderBy: { revision: 'desc' },
    });
    if (latest) {
      const previous = object(latest.record);
      const previousEvents = Array.isArray(previous.events) ? previous.events : [];
      if (
        previous.created_at !== input.created_at ||
        previous.created_by !== input.created_by ||
        previous.build_ref !== input.build_ref ||
        input.events.length < previousEvents.length ||
        ikSha256(input.events.slice(0, previousEvents.length)) !==
          ikSha256(previousEvents)
      )
        throw new DomainError(
          'IK_RELEASE_RECORD_HISTORY_CONFLICT',
          'ReleaseRecord revisions must append to the existing event history',
          409,
        );
      const digest = ikSha256(input);
      if (latest.record_hash === digest) return latest;
    }
    const row = await tx.releaseRecord.create({
      data: {
        organization_id: ctx.organizationId,
        ...scope,
        release_id: input.release_id,
        revision: (latest?.revision ?? 0) + 1,
        build_ref: input.build_ref,
        status: input.status,
        record: json(input),
        record_hash: ikSha256(input),
      },
    });
    await recordEvent(tx, ctx, 'release_record', row.id, 'ReleaseRecordAppended', {
      release_id: row.release_id,
      revision: row.revision,
      status: row.status,
      record_hash: row.record_hash,
    });
    return row;
  }

  async getReleaseRecord(ctx: ExecutionContext, releaseId: string) {
    requirePermission(ctx, 'integrations:read');
    const row = await this.db.releaseRecord.findFirst({
      where: {
        organization_id: ctx.organizationId,
        world_id: worldScope(ctx).world_id,
        release_id: releaseId,
      },
      orderBy: { revision: 'desc' },
    });
    if (!row) throw new DomainError('NOT_FOUND', 'ReleaseRecord not found', 404);
    return row;
  }

  semanticProjection(raw: unknown) {
    return ikSemanticProjection(parse(interactionEnvelope, raw));
  }
}
