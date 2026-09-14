# Orgo Worlds Interaction Kernel v1 — change manifest

## Added

- `ORGO_INTERACTION_KERNEL_v1_VALIDATION.md`

- `apps/api/src/orgo/integrations/interaction-kernel/contracts.ts`
- `apps/api/src/orgo/integrations/interaction-kernel/http-bridge.ts`
- `apps/api/src/orgo/integrations/interaction-kernel/outbound.ts`
- `apps/api/src/orgo/integrations/interaction-kernel/contracts/build-record.schema.json`
- `apps/api/src/orgo/integrations/interaction-kernel/contracts/release-record.schema.json`
- `apps/api/src/orgo/integrations/interaction-kernel/contracts/kristal-v5.0.0-rc.1.lock.json`
- `apps/api/src/orgo/integrations/daat/daat.adapter.ts`
- `apps/api/src/orgo/modules/interaction-kernel/interaction-kernel.service.ts`
- `apps/api/src/orgo/modules/interaction-kernel/interaction-kernel.module.ts`
- `apps/api/src/orgo/adapters/inbound/http/interaction-kernel.controller.ts`
- `apps/api/prisma/migrations/20260914120000_interaction_kernel/migration.sql`
- `apps/api/test/unit/interaction-kernel.test.ts`
- `docs/Technical-Reference/INTERACTION_KERNEL.md`
- `VALIDATE_ORGO_INTERACTION_KERNEL_v1.ps1`

## Modified

- `.env.example`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/orgo/runtime.module.ts`
- `apps/api/src/orgo/modules/integrations/operations.service.ts`
- `apps/api/src/orgo/platform/outbox/worker.service.ts`
- `apps/api/src/orgo/integrations/konnaxion/konnaxion.adapter.ts`
- `apps/api/src/orgo/integrations/kristal/kristal.adapter.ts`
- `apps/api/src/orgo/adapters/inbound/http/health.controller.ts`
- `apps/api/test/integration/runtime.test.ts`
- `apps/web/src/orgo/Extensions.tsx`
- `docs/README.md`

## Baseline

- Source snapshot: `Code_snapshot_Orgo_Worlds.zip`
- Source snapshot SHA-256: `09a376e0b17a6a349b5be6ab91f58ebd03318e83000e2e42c0a7fa8808db6849`
- Updated on: `2026-09-14`
- Protocol: `ik/1.1`
- Kristal pin: `v5.0.0-rc.1 @ af703bf02ee04a69a5f2ad6694fa8b8e56ae2b19`
