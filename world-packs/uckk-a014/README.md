# World pack — UCKK A014

Ce World pack est la projection Orgo du pack de démo UCKK-A014 v2.

## Frontière d'écriture

Orgo_Worlds **ne modifie jamais Orgo directement**. Chaque checkpoint fournit un document `orgo.scenario.v1`, puis délègue à `C:\mycode\Orgo\Orgo\tools\scenario-injector`.

```text
A014 canon + fixtures
      ↓
Orgo_Worlds world pack
      ↓
checkpoint scenario JSON
      ↓
Orgo Scenario Injector
      ↓
Orgo API v3
```

## Checkpoints

| Checkpoint | Effet côté Orgo |
|---|---|
| `T-14` | assertion : aucun Case A014 |
| `T-7` | assertion : aucun Case A014 |
| `T0-pre` | assertion : aucun Case A014 |
| `T0-post` | publie/simule le workflow, accepte D009 comme Signal, crée Case + Tasks |
| `J3` | observation agrégée, Case `in_progress`, tâche J3 complétée |
| `J30` | observation agrégée, tâche J30 complétée, IntegrationOperation Konnaxion `publish` |
| `J90` | finding synthétique + paquet de reconsidération; aucune décision modifiée |
| `R1` | ouverture du contexte de reconsidération; aucune nouvelle décision institutionnelle |

## Commandes

Depuis `C:\mycode\Orgo\Orgo_Worlds` :

```powershell
.\tools\world-scenario\world-scenario.ps1 validate-all uckk-a014
.\tools\world-scenario\world-scenario.ps1 plan uckk-a014 T0-post
.\tools\world-scenario\world-scenario.ps1 open uckk-a014 T0-post
```

La dernière commande ouvre le Scenario Injector d'Orgo avec le JSON déjà sélectionné. Les secrets restent saisis dans l'injecteur Orgo et ne sont pas stockés dans Orgo_Worlds.

Pour un mode CLI explicite :

```powershell
$env:ORGO_SCENARIO_ORGANIZATION = 'uckk-demo'
$env:ORGO_SCENARIO_EMAIL = '...'
$env:ORGO_SCENARIO_PASSWORD = '...'

.\tools\world-scenario\world-scenario.ps1 inject uckk-a014 T0-post --apply
```

## Invariant critique

`T-14`, `T-7` et `T0-pre` utilisent `assert_case_absent`. Un Smart Vote favorable ou une délibération Konnaxion ne crée donc jamais le Case A014; l'injection opérationnelle commence uniquement après publication de `UCKK-D009`.
