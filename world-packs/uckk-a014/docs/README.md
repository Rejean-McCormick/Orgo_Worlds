# UCKK + Konnaxion + Orgo — Demo Pack v2

Pack Markdown optimisé de la vertical slice **UCKK-A014**.

## Commencer ici

`00_INDEX.md`

## Pourquoi une v2?

La première version était utile pour explorer l'idée, mais répétait certaines règles entre plusieurs documents.

Cette version :

```text
15 fichiers → 10 documents canoniques + README
```

et ajoute :

```text
une machine d'état globale
un evidence ledger
un statut de maturité pour chaque contrat
une séparation stricte source / target / demo fixture
une seule définition par invariant
un seul UX + runbook
un seul architecture + contracts
```

## Mapping v1 → v2

| Ancienne v1 | Nouvelle v2 |
|---|---|
| `00_INDEX` | `00_INDEX` |
| `01_THESE_ET_POSITIONNEMENT` | `00_INDEX` + `01_CANON_ET_AUTORITE` |
| `02_SCENARIO_CANONIQUE` | `02_SCENARIO_A014` |
| `03_AUTORITE_ET_FRONTIERES` | `01_CANON_ET_AUTORITE` |
| `04_ARCHITECTURE_END_TO_END` | `04_ARCHITECTURE_ET_CONTRATS` |
| `05_CONTRATS_TECHNIQUES` | `04_ARCHITECTURE_ET_CONTRATS` |
| `06_UX_STORYBOARD` | `06_DEMO_UX_RUNBOOK` |
| `07_SEEDS_ET_FIXTURES` | `05_SEEDS_FIXTURES` |
| `08_VERTICAL_SLICE_IMPLEMENTATION` | `07_IMPLEMENTATION_PLAN` |
| `09_RUNBOOK_DEMO` | `06_DEMO_UX_RUNBOOK` |
| `10_RISQUES_ANTI_PATTERNS` | `01_CANON_ET_AUTORITE` + tests |
| `11_CRITERES_ACCEPTATION` | `08_TESTS_ACCEPTANCE` |
| `12_VARIANTES_ET_PUBLICS` | retiré du canon principal |
| `13_SOURCES_ET_ANCRAGES` | `09_EVIDENCE_LEDGER` |

## Documents

```text
00_INDEX.md
01_CANON_ET_AUTORITE.md
02_SCENARIO_A014.md
03_STATE_MACHINE.md
04_ARCHITECTURE_ET_CONTRATS.md
05_SEEDS_FIXTURES.md
06_DEMO_UX_RUNBOOK.md
07_IMPLEMENTATION_PLAN.md
08_TESTS_ACCEPTANCE.md
09_EVIDENCE_LEDGER.md
```

## Règle

Le pack v2 remplace la v1 comme base de travail pour cette démo.
