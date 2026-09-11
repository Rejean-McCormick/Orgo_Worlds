# Plan d'implémentation

Ce document est la source de vérité pour ce qui doit réellement être construit.

---

## 1. Principe

Construire **la boucle la plus étroite qui prouve l'architecture**.

Ne pas implémenter :

```text
toute la vision Konnaxion
toute UCKK
toute la réforme universitaire
un bus d'événements universel
une synchronisation bidirectionnelle
un data warehouse
une nouvelle couche Koali
```

---

## 2. Inventaire de maturité

| Capacité | Statut actuel du pack source | Action |
|---|---|---|
| Konnaxion arguments/baseline/advisory separation | `SOURCE_CANON` | seed + utiliser |
| Konnaxion↔Orgo adapter | `NO_ACTIVE_ADAPTER` | construire petit adapter |
| UCKK Assembly authority | `SOURCE_CANON` | utiliser/valider runtime |
| UCKK connected Konnaxion mode | `DOCUMENTED_TARGET`/gates | ne pas sur-vendre |
| Orgo persisted Signal | `IMPLEMENTED_ORGO` | utiliser |
| Orgo `/signals` | `IMPLEMENTED_ORGO` | utiliser |
| Orgo workflow versioning | `IMPLEMENTED_ORGO` | utiliser |
| Orgo simulation | `IMPLEMENTED_ORGO` | utiliser |
| Orgo Case/Task | `IMPLEMENTED_ORGO` | utiliser |
| Orgo IntegrationOperation | `IMPLEMENTED_ORGO` | utiliser |
| Orgo Konnaxion allowlist publish/distribute | `IMPLEMENTED_ORGO` protocole | brancher |
| provider Konnaxion bridge | `NO_ACTIVE_ADAPTER` | construire |
| UCKK→Orgo decision adapter | `DEMO_CONTRACT_V1` | construire |
| Moodle→Orgo observation adapter | `DEMO_CONTRACT_V1` | P1; fixture acceptable |
| virtual clock | `DEMO_CONTRACT_V1` | construire |
| one-click reset | `DEMO_CONTRACT_V1` | construire |

---

## 3. P0 — vertical slice crédible

### P0.1 Demo manifest

Créer :

```text
demo/uckk-a014/manifest.yaml
```

Il contient les identifiants stables et les références runtime résolues.

### P0.2 Seeds Konnaxion

Créer :

```text
A014 Topic
personas DEMO
arguments
baseline
Smart Vote reading
Impact slots
A014-R1 hidden
```

### P0.3 Seed UCKK

Créer :

```text
A014 motion
source documents
A014.2 amendment
D009 template
archive refs
```

### P0.4 UCKK → Orgo adapter

Construire le chemin :

```text
decision published
→ normalize
→ POST /signals
```

Exigences :

```text
idempotent
organization-scoped
no PII
authority ref
archive ref
correlation id
auditable failure
```

### P0.5 Workflow Orgo

Créer et publier une WorkflowVersion immuable.

Tester :

```text
simulate
execute
replay
```

### P0.6 Case projection

Le Case doit montrer :

```text
source decision
authority
mandate
correlation
tasks
signals
integration operation
```

### P0.7 Konnaxion provider adapter

Implémenter **uniquement** :

```text
publish
```

`distribute` n'est pas nécessaire au gold path.

### P0.8 Impact endpoint/service Konnaxion

Le provider adapter doit muter Konnaxion via un service Konnaxion-owned.

Pas de SQL cross-system.

### P0.9 Virtual clock

Minimum :

```text
T-14
T-7
T0-pre
T0-post
J3
J30
J90
R1
```

### P0.10 Reset

Une commande.

Aucun SQL manuel requis.

---

## 4. P1 — renforcement

### P1.1 Moodle observation adapter live

Remplacer l'injection fixture par :

```text
Moodle aggregate
→ safe Signal
→ Orgo
```

### P1.2 Smart Vote import UCKK live

Si le runtime connecté est suffisamment mûr :

```text
Konnaxion reading
→ UCKK snapshot
```

Sinon, seed contrôlé.

### P1.3 Trace panel

Page technique :

```text
corr:uckk:A014:D009

UCKK
D009
  ↓
Orgo
Signal
Case
IntegrationOperation
  ↓
Konnaxion
Impact
```

### P1.4 Bridge failure mode

Toggle :

```text
KONNAXION_BRIDGE_FAIL=true
```

puis redrive.

### P1.5 Browser E2E

Automatiser le gold path.

---

## 5. P2 — industrialisation

```text
privacy audit
penetration/security pass
full connector observability
retention policy
operator handbook
localization
seed migration/versioning
cross-repo CI contract tests
```

---

## 6. Ordre d'implémentation recommandé

```text
1. Canon + manifest
2. Seeds A014
3. Orgo workflow
4. UCKK→Orgo adapter
5. Case UX
6. Virtual clock
7. Konnaxion impact schema/service
8. provider bridge
9. reset
10. golden tests
11. trace panel
12. optional live Moodle observations
```

Ce séquencement maximise la démontrabilité rapide.

---

## 7. Repo ownership

### Konnaxion repo

Ajouter uniquement ce qui appartient à Konnaxion :

```text
demo seed
impact DTO/service
provider-side bridge adapter
A014/R1 fixtures
```

### Orgo repo

```text
workflow seed
integration config
presentation metadata if needed
tests
```

Éviter de changer le core Orgo si le runtime actuel possède déjà les primitives nécessaires.

### UCKK-Moodle repo

```text
A014 seed
decision handoff service/observer
optional observation export
demo clock/reset hooks where appropriate
```

### Demo harness repo/directory

Préférable pour :

```text
manifest
clock
reset orchestration
cross-system health check
presenter shortcuts
```

Le harness ne doit pas devenir source de vérité métier.

---

## 8. Definition of ready pour commencer le code

```text
[ ] exact Orgo /signals request schema confirmed
[ ] exact workflow import/publication path confirmed
[ ] exact integration callback permissions confirmed
[ ] exact UCKK Assembly publication hook confirmed
[ ] Konnaxion impact owner service chosen
[ ] no direct DB bridge planned
[ ] tenant/org IDs resolved
[ ] demo manifest accepted
```

Les éléments non confirmés restent `GAP_TO_VERIFY`.
