# Orgo Worlds — Interaction Kernel v1.1 integration

**Status:** implementation update, 2026-09-14
**Protocol:** `ik/1.1`
**Kristal baseline:** `5.0.0-rc.1` / `af703bf02ee04a69a5f2ad6694fa8b8e56ae2b19`

## 1. Architecture

Orgo remains the owner of Signal, Workflow, Case, Task, IntegrationOperation and delivery state. Interaction Kernel is a boundary protocol; it does not introduce a parallel lifecycle or a second outbox.

```text
Konnaxion -- governance.decision.execute --> Orgo IK boundary
                                              |
                                              v
                                            Signal
                                              |
                                              v
                                      pinned WorkflowVersion
                                              |
                                              v
                                        Case / Tasks

Orgo IntegrationOperation --> existing Outbox --> Konnaxion / Da'at
```

## 2. Inbound Konnaxion → Orgo

Canonical endpoint:

```text
POST /api/v3/w/{world_key}/ik/interactions
```

The initial accepted Profile is:

```text
governance.decision.execute/1.0.0
```

Admission is fail-closed. The command must contain:

- `source.system = konnaxion`;
- `target.system = orgo`;
- the authenticated tenant/World must match the source/target organization and target World; if `target.release` is supplied it must match the active World release;
- `authority.kind = governance-mandate`;
- an idempotency key matching the HTTP `Idempotency-Key` header;
- a `konnaxion.decision_record` ArtifactRef;
- payload `decision_revision`.

The IK request fingerprint is SHA-256 over RFC 8785/JCS of the semantic projection. Volatile record fields such as `id`, `time`, correlation and trace are excluded.

## 3. World-owned decision routing

Konnaxion never names an Orgo Case or Task. The current `WorldRelease.config` resolves the command to an Orgo-owned workflow.

Example release config:

```json
{
  "interaction_kernel": {
    "decision_execute": {
      "workflow_code": "governed-decision",
      "label": "2.11",
      "type": "governance_decision",
      "category": "request",
      "severity": "MODERATE",
      "title_prefix": "Governed decision"
    }
  }
}
```

The referenced workflow must be active and must have a `WorkflowVersion` pinned to the current World release. Missing configuration is `IK_TARGET_NOT_READY`; nothing is silently routed to a fallback workflow.

## 4. Reliable admission

Orgo reuses the existing `IdempotencyRecord`, Signal and Outbox infrastructure.

```text
same idempotency key + same semantic fingerprint
=> replay the same stored Receipt

same idempotency key + different semantic fingerprint
=> IK_IDEMPOTENCY_CONFLICT
```

No `IK_Outbox` table exists.

## 5. Artifact interchange

Orgo now persists lightweight `ArtifactLink` records. Their identity is scoped by owner system/organization/instance + type + artifact ID + version, with digest/locator metadata and never copy canonical Kristal payloads into Case/Task state.

`POST /api/v3/w/{world}/ik/exports` returns `orgo.export/1.0.0` manifests containing immutable-ish subject references plus JCS/SHA-256 snapshot digests. The manifest carries references only; IK is not an artifact store.

## 6. kOA BuildRecord / ReleaseRecord

The existing kOA schemas are vendored under:

```text
apps/api/src/orgo/integrations/interaction-kernel/contracts/
```

Persistence is Orgo-owned:

- `BuildRecord` is immutable per `(organization, world, build_id)` and local status is descriptive (`RECORDED` / `RECORDED_WITH_STAGE_FAILURES`), not a Kristal v4 global compile gate;
- `ReleaseRecord` is revisioned and its event history is append-only;
- Kristal outputs remain opaque references;
- the old v4 global “no compile on fail” rule is not reintroduced. A Working Exchange may exist before final validation/recognition when the v5 workflow permits it.

## 7. Outbound Konnaxion migration

`KonnaxionAdapter` is migration-safe:

- if `KONNAXION_IK_URL` is unset, existing J30 legacy delivery remains unchanged;
- if `KONNAXION_IK_URL` is configured, `publish` maps to `accountability.impact.publish/1.0.0` and is delivered as IK;
- unsupported legacy operations continue through the legacy bridge.

## 8. Da'at / Kristal

New Kristal v5 workflows use provider `daat`.

Supported initial operations:

- `build` → `kristal.build.request/1.0.0`;
- `revision` → `kristal.revision.request/1.0.0`.

The old provider `kristal` remains only as a migration compatibility path for the existing direct `validate` bridge.

## 9. Configuration

New optional environment variables:

```text
DAAT_IK_URL
DAAT_IK_TOKEN
KONNAXION_IK_URL
KONNAXION_IK_TOKEN
KONNAXION_IK_WORLD
```

Legacy variables remain valid during migration.

## 10. Database additions

Migration `20260914120000_interaction_kernel` adds only protocol/artifact control-plane state:

- `artifact_links`;
- `build_records`;
- `release_records`.

It does not add duplicate Case/Task/Workflow/Signal/Outbox state.
