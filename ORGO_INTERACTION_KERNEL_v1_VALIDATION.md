# Orgo Worlds — Interaction Kernel v1 validation report

**Date:** 2026-09-14
**Baseline:** `Code_snapshot_Orgo_Worlds.zip`
**Protocol:** `ik/1.1`

## Gates executed in this environment

- `node scripts/check-architecture.mjs` — **PASS**
- `node scripts/check-worlds.mjs` — **PASS**
- TypeScript syntax transpilation of the 16 modified/new TS/TSX files with TypeScript 5.x — **PASS**
- source-vs-updated diff review — **PASS**; modifications are restricted to the IK integration surface, Prisma migration/schema, provider wiring, tests, config and documentation
- generic IK HTTP bridge review — **PASS**; no Orgo-specific World header is injected into arbitrary outbound IK targets
- vendored kOA BuildRecord/ReleaseRecord schemas and pinned Kristal lock are present under the IK contract boundary

## Native gates supplied but not executable in this sandbox

The snapshot does not include `node_modules` or a package lock, and the sandbox does not have the Orgo dependency graph cached. `npm install --offline` therefore fails with `ENOTCACHED`. The following native gates are supplied in `VALIDATE_ORGO_INTERACTION_KERNEL_v1.ps1` and MUST be run on the Orgo development machine/CI:

1. `npm run db:generate`
2. `npm run typecheck -w api`
3. `npm run test -w api`
4. with `TEST_DATABASE_URL`: Prisma deploy + integration suite
5. `npm run build -w api`

## Added integration coverage

The Orgo integration suite now includes a Konnaxion `governance.decision.execute/1.0.0` scenario that verifies:

1. WorldRelease-owned routing;
2. creation of an idempotent Signal;
3. existing Outbox worker processing;
4. Workflow execution and resulting Case creation;
5. replay of the same semantic request returns the same Receipt;
6. same idempotency identity with divergent semantic content returns `IK_IDEMPOTENCY_CONFLICT`.

## Migration posture

- Existing J30 Konnaxion bridge remains the default unless `KONNAXION_IK_URL` is configured.
- Existing `IntegrationOperation`, `OutboxMessage`, Signal, Workflow, Case and Task lifecycles are reused.
- No parallel IK outbox or IK work lifecycle is introduced.
- Direct `kristal` provider remains legacy-only; new Kristal v5 build/revision operations use `provider=daat`.

## Additional static gates

- IK contract JSON files parse successfully — **PASS**
- Kristal version/tag/commit/schema-set pin consistency — **PASS**
- Prisma model ↔ SQL migration presence for ArtifactLink/BuildRecord/ReleaseRecord — **PASS**
- absence of a duplicate IK outbox table — **PASS**
