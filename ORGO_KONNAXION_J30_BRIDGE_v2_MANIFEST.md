# Drop-in manifest — Orgo ↔ Konnaxion J30 Impact Bridge v2

## Existing files replaced from the supplied/current snapshots

```text
Konnaxion/Konnaxion_Worlds/backend/config/urls.py
Konnaxion/Konnaxion_Worlds/backend/konnaxion/ethikos/models.py
Orgo/Orgo/tools/scenario-injector/lib.mjs
Orgo/Orgo/tools/scenario-injector/tests/lib.test.mjs
Orgo/Orgo_Worlds/world-packs/uckk-a014/scenarios/J30.scenario.json
```

## New files

```text
Konnaxion/Konnaxion_Worlds/backend/konnaxion/ethikos/orgo_bridge_contract.py
Konnaxion/Konnaxion_Worlds/backend/konnaxion/ethikos/orgo_bridge_views.py
Konnaxion/Konnaxion_Worlds/backend/konnaxion/ethikos/orgo_bridge_urls.py
Konnaxion/Konnaxion_Worlds/backend/konnaxion/ethikos/migrations/0006_orgo_impact_publication.py
Konnaxion/Konnaxion_Worlds/backend/konnaxion/ethikos/management/__init__.py
Konnaxion/Konnaxion_Worlds/backend/konnaxion/ethikos/management/commands/__init__.py
Konnaxion/Konnaxion_Worlds/backend/konnaxion/ethikos/management/commands/orgo_bridge_setup.py
Konnaxion/Konnaxion_Worlds/backend/konnaxion/ethikos/tests/test_orgo_bridge_contract.py
Orgo/Orgo_Worlds/Orgo_Konnaxion_Bridge_Manager.pyw
Orgo/Orgo_Worlds/VALIDATE_ORGO_KONNAXION_BRIDGE_v2.ps1
Orgo/Orgo_Worlds/ORGO_KONNAXION_J30_BRIDGE_v2.md
Orgo/Orgo_Worlds/ORGO_KONNAXION_J30_BRIDGE_v2_MANIFEST.md
```

The unchanged Scenario Injector example fixture is not part of the drop-in; it was used only to run the existing test suite during package validation.
