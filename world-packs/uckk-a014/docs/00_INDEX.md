# UCKK + Konnaxion + Orgo — Vertical Slice canonique

**Version:** 2.0 — pack optimisé  
**Scénario:** UCKK-A014 — pilote pédagogique expérimental  
**But:** spécifier une démo déterministe, crédible et implémentable de la boucle :

```text
délibération → décision → exécution → observation → reconsidération
```

---

## 1. Thèse

La démo ne présente pas trois applications.

Elle montre une seule capacité institutionnelle :

> **Une communauté peut transformer un désaccord en décision autorisée, transformer cette décision en travail traçable, observer ce qui arrive réellement, puis réviser la décision sans transférer silencieusement l'autorité d'un système à un autre.**

Architecture narrative :

```text
                         UCKK
               institution / autorité
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
   Konnaxion         UCKK-Moodle          Orgo
   délibérer          pratiquer          exécuter
   comprendre         apprendre          coordonner
   lire               prouver            réconcilier
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ▼
                mémoire / observations
                         │
                         ▼
                  reconsidération
                         │
                         ▼
                         UCKK
```

UCKK n'est donc **pas une étape entre Konnaxion et Orgo**.  
UCKK est le contexte institutionnel persistant dans lequel les autres systèmes jouent des rôles distincts.

---

## 2. Légende de statut obligatoire

Toutes les affirmations importantes de ce pack doivent être interprétées avec l'un des statuts suivants.

| Statut | Signification |
|---|---|
| `SOURCE_CANON` | règle explicitement soutenue par les documents fournis |
| `IMPLEMENTED_ORGO` | capacité décrite comme livrée/active dans le snapshot Orgo fourni |
| `DOCUMENTED_TARGET` | architecture cible documentée mais pas nécessairement validée de bout en bout |
| `NO_ACTIVE_ADAPTER` | frontière explicitement documentée comme non intégrée actuellement |
| `DEMO_CONTRACT_V1` | contrat proposé uniquement pour cette vertical slice |
| `SYNTHETIC_FIXTURE` | données/personas/résultats fictifs destinés à la démo |
| `GAP_TO_VERIFY` | point qui doit être confirmé dans le code/runtime avant revendication |

Une démo ne doit jamais présenter `DEMO_CONTRACT_V1` comme `IMPLEMENTED_ORGO`, ni une `SYNTHETIC_FIXTURE` comme résultat empirique.

---

## 3. Source de vérité documentaire

Chaque sujet possède **un seul document canonique dans ce pack**.

| Sujet | Document canonique |
|---|---|
| vision, statut, vocabulaire | `00_INDEX.md` |
| autorité, ownership, invariants | `01_CANON_ET_AUTORITE.md` |
| histoire métier du pilote | `02_SCENARIO_A014.md` |
| états T-14 → J90 | `03_STATE_MACHINE.md` |
| flux, DTO, API, bridge | `04_ARCHITECTURE_ET_CONTRATS.md` |
| données synthétiques, manifest, reset | `05_SEEDS_FIXTURES.md` |
| écrans + narration + runbook | `06_DEMO_UX_RUNBOOK.md` |
| ce qu'il faut construire | `07_IMPLEMENTATION_PLAN.md` |
| tests + Definition of Done | `08_TESTS_ACCEPTANCE.md` |
| provenance des assertions | `09_EVIDENCE_LEDGER.md` |

**Règle:** si une donnée est définie dans un autre document, elle doit référencer le document canonique plutôt que la redéfinir.

---

## 4. Formule canonique par système

```text
UCKK
= institution expérimentale / univers-cité / autorité humaine

Konnaxion
= délibération structurée / arguments / source participation /
  baseline / Smart Vote advisory / EkoH / impact-accountability

UCKK-Moodle
= campus / apprentissage / cours / preuves /
  décisions d'Assemblée / archives / intégrité / vie privée

Orgo
= Signals / Workflows / Cases / Tasks /
  coordination / effets externes durables / receipts / réconciliation

Archives UCKK
= mémoire institutionnelle / provenance / contestation
```

---

## 5. Invariant de handoff

Le déclencheur d'Orgo n'est pas :

```text
Smart Vote favorable
```

Le déclencheur canonique est :

```text
UCKK Assembly
decision = published
        ↓
adapter
        ↓
Orgo Signal
```

`SOURCE_CANON` : Konnaxion/Smart Vote peut informer une Assemblée, mais ne possède pas la décision institutionnelle UCKK.

---

## 6. Scénario

UCKK envisage un pilote pédagogique d'une session dans trois sections :

```text
équipes de 4–6
rôles tournants
charte d'équipe
sprints de 2 semaines
journalisation des contributions
évaluation provisoire 50/30/20
garde-fous et appel humain
revue Jour 30
reconsidération Jour 90
```

Le pilote est une **hypothèse institutionnelle à tester**, pas une réussite déjà prouvée.

---

## 7. Gold path

```text
T-14
UCKK publie la motion A014
        ↓

Konnaxion
arguments + objections + sources
        ↓

T-7
baseline + lecture Smart Vote séparée
        ↓

T0
Assemblée UCKK décide
        ↓

décision UCKK-D009 publiée
        ↓

Orgo reçoit un Signal
        ↓

workflow simulé
        ↓

workflow exécuté
        ↓

Case + Tasks
        ↓

J3 / J30
observations du pilote
        ↓

Orgo coordonne le suivi
        ↓

Orgo demande à Konnaxion de publier un bilan
        ↓

Impact / accountability
        ↓

J90
question de gouvernance rouverte
        ↓

Konnaxion
nouvelle délibération
        ↓

UCKK
nouvelle décision
```

---

## 8. Définition de réussite

Une personne qui découvre le système doit pouvoir répondre, sans ambiguïté :

```text
Qui a délibéré?
→ la communauté via Konnaxion

Qui a produit la lecture Smart Vote?
→ Konnaxion

Qui a autorisé le pilote?
→ l'Assemblée UCKK

Qui possède la décision?
→ UCKK-Moodle / Assembly

Qui a transformé le mandat en travail?
→ Orgo

Qui possède les Cases et Tasks?
→ Orgo

Qui possède les notes et preuves académiques?
→ UCKK-Moodle

Qui peut changer la politique?
→ l'autorité institutionnelle compétente, pas Orgo

Pourquoi le Jour 90 revient-il dans Konnaxion?
→ parce qu'une observation n'est pas une décision
```

---

## 9. Anti-objectifs

Cette vertical slice ne cherche pas à démontrer :

```text
une “super-app”
une base de données partagée
une synchronisation universelle
un gouvernement par algorithme
une université accréditée fictive
un succès pédagogique empirique
un event bus général
une intégration de tout le kOA Digital Ecosystem
```

Elle cherche à démontrer **l'intégration sans contamination des autorités**.

Commencer par `01_CANON_ET_AUTORITE.md`.
