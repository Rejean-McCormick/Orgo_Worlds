# Drop-in manifest — World Scenario Injection v1

Ce drop-in complète une installation existante de `Orgo` + `Orgo_Worlds_PHASE5_STANDALONE_v1`.

## Orgo remplacé/ajouté

- `OrgoScenarioInjector.pyw`
- `docs/Technical-Reference/SCENARIO_INJECTOR.md`
- `tools/scenario-injector/{lib.mjs,cli.mjs,scenario.ps1,README.md,AI_TEMPLATE.md}`
- `tools/scenario-injector/tests/lib.test.mjs`

## Orgo_Worlds ajouté

- `Orgo_World_Scenario_Manager.pyw`
- `WORLD_SCENARIO_INJECTION.md`
- `tools/world-scenario/{cli.mjs,world-scenario.ps1}`
- `world-packs/uckk-a014/` canon + checkpoints

## Gate de construction

- syntaxe Node : PASS
- syntaxe Python : PASS
- tests Scenario Injector : 8/8 PASS
- `validate-all uckk-a014` : 8/8 PASS
- aucun appel HTTP direct depuis `Orgo_Worlds/tools/world-scenario` : PASS
- aucun SQL dans le bridge/scénarios : PASS
- aucun UUID runtime littéral dans les scénarios : PASS
