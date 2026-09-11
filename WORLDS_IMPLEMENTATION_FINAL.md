# Orgo Worlds — Phases 1 à 5

Cette livraison construit **Orgo_Worlds** comme application standalone sœur de `Orgo`. Elle possède son propre Web, API, worker, PostgreSQL, migrations, Common Login, control plane et World Manager.

## Implémenté

- P1 : `World`, `WorldRelease`, `WorldMembership`, audit et control plane.
- P2 : runtime canonique `/api/v3/w/{world_key}/...` et contexte de release épinglé.
- P3 : isolation/provenance World sur Signal, Case, Task, Workflow, idempotence, WorkEvent et Outbox; le worker conserve la release d’origine.
- P4 : World `main` + `r1` et backfill des données historiques.
- P5 : World Switcher, World Manager web et `Orgo_World_Manager.pyw`.

PostgreSQL renforce aussi la cohérence `(world_id, world_release_id)` par clés étrangères composites. Un owner/maintainer peut gérer son World sans devenir administrateur global; la création de Worlds demeure une permission d’organisation.

## Validation

Le gate statique inclus dans `validation/worlds-phase5-static-2026-09-11T15-45-00Z/` est PASS. Le gate natif n’a pas pu installer les paquets dans l’environnement de construction faute d’accès réseau au registre npm. Sur Windows, exécuter :

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\VALIDATE_ORGO_WORLDS.ps1
```

Ce script crée une base PostgreSQL 16 isolée et exécute Prisma, migrations, architecture, invariants Worlds, typecheck, tests unitaires, intégration et build.
