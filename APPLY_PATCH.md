# Apply Orgo Worlds Interaction Kernel v1

Baseline: `Code_snapshot_Orgo_Worlds.zip`.

## Git patch

Copy `Orgo_Worlds_Interaction_Kernel_v1.patch` to the repository root, then run:

```powershell
git apply --check .\Orgo_Worlds_Interaction_Kernel_v1.patch
git apply .\Orgo_Worlds_Interaction_Kernel_v1.patch
.\VALIDATE_ORGO_INTERACTION_KERNEL_v1.ps1
```

## File overlay

Alternatively, overlay the files from this package while preserving relative paths.

`VALIDATE_ORGO_INTERACTION_KERNEL_v1.ps1` requires the normal Orgo npm dependencies. Set `TEST_DATABASE_URL` to run migration + integration tests.
