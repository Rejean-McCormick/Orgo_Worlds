# Orgo Worlds — Interaction Kernel v1 update

This update integrates Orgo Worlds with Interaction Kernel `ik/1.1` while preserving Orgo ownership and the existing J30 Konnaxion bridge.

## Delivered

- inbound `governance.decision.execute/1.0.0`;
- WorldRelease-owned routing to pinned Orgo WorkflowVersion;
- RFC 8785/JCS semantic request fingerprinting + idempotent replay/conflict semantics;
- `ArtifactLink` and `orgo.export/1.0.0`;
- kOA `BuildRecord` and revisioned `ReleaseRecord` persistence;
- `daat` provider for new Kristal v5 build/revision workflows;
- optional IK outbound for Konnaxion publish, with legacy bridge fallback;
- Kristal `5.0.0-rc.1` lock metadata and kOA Build/Release schemas;
- unit and integration test coverage added to the existing suites.

See `docs/Technical-Reference/INTERACTION_KERNEL.md`.
