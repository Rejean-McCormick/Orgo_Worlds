# Seeds, fixtures et reset

Ce document est la source de vérité des données de démonstration.

---

## 1. Règle épistémique

Chaque donnée fictive doit porter :

```text
SYNTHETIC
DEMO FIXTURE
NOT A RESEARCH FINDING
```

Aucune personne fictive ne doit être présentée comme participante réelle.

---

## 2. Identifiants stables

```yaml
demo_id: uckk-pedagogy-pilot-a014

uckk:
  assembly_ref: UCKK-A014
  motion_ref: UCKK-M014
  decision_ref: UCKK-D009
  archive_ref: UCKK-ARCH-A014-D009

konnaxion:
  topic_ref: ethikos-topic:UCKK-A014
  baseline_ref: baseline:UCKK-A014:v1
  smart_vote_ref: sv:UCKK-A014:v1
  impact_day30_ref: impact:UCKK-A014:day30:v1
  impact_day90_ref: impact:UCKK-A014:day90:v1
  followup_topic_ref: ethikos-topic:UCKK-A014-R1

orgo:
  organization_key: uckk-demo
  workflow_code: uckk_pedagogy_pilot
  case_external_reference: uckk:assembly:A014:decision:D009:v1

trace:
  correlation_id: corr:uckk:A014:D009
```

Ne jamais hardcoder les UUID runtime dans le scénario.  
Le seed résout les UUID et produit un manifest runtime.

---

## 3. Personas

| ID | Nom fictif | Rôle |
|---|---|---|
| `p01` | Maya Tremblay | étudiante |
| `p02` | Elias Chen | professeur |
| `p03` | Nadia Bouchard | accessibilité |
| `p04` | Amélie Fortin | évaluation |
| `p05` | Karim El-Mansouri | facilitateur |
| `p06` | Jordan Roy | étudiant-coordinateur |

UI :

```text
DEMO PERSONA
```

---

## 4. Arguments

Minimum recommandé : 10.

```yaml
arguments:
  - id: arg01
    side: pro
    claim: "Les sprints rendent les problèmes visibles plus tôt."
    actor: p02

  - id: arg02
    side: pro
    claim: "La rotation donne une expérience plus diversifiée des rôles."
    actor: p01

  - id: arg03
    side: pro
    claim: "Une contribution tracée peut améliorer la discussion lors des appels."
    actor: p04

  - id: arg04
    side: con
    claim: "Le peer review peut refléter la popularité plus que la contribution."
    actor: p01

  - id: arg05
    side: con
    claim: "Les sprints peuvent augmenter la charge de mentorat."
    actor: p02

  - id: arg06
    side: con
    claim: "Les journaux peuvent invisibiliser le travail non observable."
    actor: p03

  - id: arg07
    side: con
    claim: "La coordination peut devenir une charge asymétrique."
    actor: p06

  - id: arg08
    side: nuance
    claim: "Le 50/30/20 doit être traité comme hypothèse expérimentale."
    actor: p04

  - id: arg09
    side: amendment
    claim: "Publier les rubriques avant le début des travaux."
    actor: p05

  - id: arg10
    side: amendment
    claim: "Préserver un mécanisme humain d'appel."
    actor: p03
```

---

## 5. Baseline

`SYNTHETIC_FIXTURE`

```yaml
baseline:
  approve: 0.58
  approve_with_conditions: 0.29
  reject: 0.13
```

UI obligatoire :

```text
DEMO DATA
Source participation / baseline
```

---

## 6. Smart Vote

`SYNTHETIC_FIXTURE`

Le chiffre importe moins que la différence explicable.

Exemple :

```yaml
smart_vote:
  reading: "approve_with_conditions"
  confidence_display: "moderate"
  authority: "computed_reading_only"
  context:
    - assessment
    - accessibility
    - pedagogy
```

UI :

```text
ADVISORY READING
DEMO DATA
DOES NOT REPLACE BASELINE
```

---

## 7. Décision D009

```yaml
decision:
  outcome: approved_with_conditions
  scope:
    sections: 3
    team_size_min: 4
    team_size_max: 6
    sprint_weeks: 2
    rotating_roles: true
    contribution_journaling: true
  evaluation:
    individual: 0.50
    peer_engagement: 0.30
    traced_contribution: 0.20
  amendment: A014.2
  review_days: [3, 30, 90]
```

---

## 8. Jour 3

`SYNTHETIC_FIXTURE`

```yaml
checkpoint: day_3
teams_formed: 8
charters_accepted: 7
accessibility_reviews_open: 1
```

---

## 9. Jour 30

`SYNTHETIC_FIXTURE`

```yaml
checkpoint: day_30
workload_imbalance_reports: 6
peer_rubric_clarification_requests: 2
policy_changes: 0
```

---

## 10. Jour 90

`SYNTHETIC_FIXTURE`

```yaml
checkpoint: day_90
finding:
  code: coordinator_role_burden
  statement: >
    The coordinator role appears to absorb disproportionate
    follow-up work in several teams.
governance_reconsideration_required: true
```

Le mot `finding` dans la fixture signifie “observation de démo”, pas conclusion scientifique.

---

## 11. Manifest runtime

Le reset génère :

```yaml
runtime:
  orgo:
    organization_id: "<uuid>"
    workflow_definition_id: "<uuid>"
    workflow_version_id: "<uuid>"
    case_id: null_at_T14

  uckk:
    assembly_db_id: "<id>"
    decision_db_id: null_at_T14

  konnaxion:
    topic_db_id: "<id>"
    impact_day30_db_id: null_at_T14

  clock:
    state: T-14
```

---

## 12. Horloge

Commandes suggérées :

```text
demo clock set T-14
demo clock set T-7
demo clock set T0-pre
demo clock set T0-post
demo clock set J3
demo clock set J30
demo clock set J90
demo clock set R1
```

`DEMO_CONTRACT_V1` : le mécanisme exact peut être CLI, admin page ou script selon les repos.

---

## 13. Reset Sandbox

Contrat :

```text
1. remove Orgo demo work for demo_id
2. restore pinned workflow version
3. reset UCKK A014 to T-14 state
4. reset Konnaxion A014
5. remove demo impact updates
6. hide/reset A014-R1
7. set virtual clock T-14
8. regenerate runtime manifest
9. run health assertions
```

Sortie :

```json
{
  "demo_id": "uckk-pedagogy-pilot-a014",
  "state": "T-14",
  "healthy": true,
  "assertions": {
    "uckk_motion_exists": true,
    "uckk_decision_published": false,
    "konnaxion_topic_exists": true,
    "orgo_case_exists": false,
    "day30_impact_exists": false,
    "followup_visible": false
  }
}
```

---

## 14. Fixtures à ne pas seed

Ne pas inventer :

```text
vraies statistiques d'apprentissage
vrais taux de réussite
vrais gains d'engagement
vrais diagnostics de santé mentale
vraies sanctions
vraies données étudiantes
```

Si la démo veut montrer une de ces catégories, elle doit rester explicitement fictive et ne pas prétendre constituer une validation.
