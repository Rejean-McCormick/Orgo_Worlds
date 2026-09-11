# Scénario canonique — UCKK-A014

Ce document est la source de vérité métier du scénario.

Tous les noms personnels et chiffres d'observation sont `SYNTHETIC_FIXTURE`.

---

## 1. Problème institutionnel

UCKK veut savoir s'il doit tester pendant une session un modèle pédagogique où les étudiants travaillent dans des équipes hétérogènes, avec rôles tournants, sprints courts et évaluation hybride.

La question n'est pas :

> Ce modèle est-il déjà prouvé?

La question est :

> **Est-il suffisamment plausible, encadré et réversible pour mériter un pilote institutionnel?**

---

## 2. Motion

```text
UCKK-A014
Pilote pédagogique expérimental

Autoriser un déploiement expérimental d'une session
dans trois sections UCKK.

Le pilote comprend :
- équipes de 4 à 6;
- rôles tournants;
- charte d'équipe;
- sprints de 2 semaines;
- journalisation des contributions;
- évaluation provisoire 50/30/20.

Conditions minimales :
- rubriques publiées;
- mécanisme humain d'appel;
- revue d'accessibilité;
- revue de processus au Jour 30;
- reconsidération institutionnelle au Jour 90.

Le pilote ne constitue pas une adoption générale.
```

---

## 3. Ce que signifie 50/30/20 dans la démo

`DEMO_CONTRACT_V1`

Le pack utilise la convention :

```text
50 % — performance individuelle
30 % — pairs / engagement sous rubrique
20 % — contribution personnelle tracée
```

Si la réforme source définit une sémantique différente dans sa version finale, la fixture doit être alignée avant implémentation.

---

## 4. Acteurs

### Maya Tremblay — étudiante

Position :

```text
favorable avec conditions
```

Argument :

> La rotation évite que certaines personnes restent enfermées dans le même rôle.

Objection :

> Une forte composante de pairs peut devenir socialement biaisée.

### Elias Chen — professeur

Position :

```text
favorable prudent
```

Argument :

> Les sprints rendent les problèmes visibles plus tôt.

Objection :

> Le coût de feedback et de mentorat peut être sous-estimé.

### Nadia Bouchard — accessibilité

Position :

```text
conditionnelle
```

Objection :

> Une trace d'activité ne capture pas nécessairement le travail invisible ou certaines contraintes d'accessibilité.

### Amélie Fortin — évaluation

Position :

```text
expérimentale
```

Question :

> Le 50/30/20 doit être évalué comme une hypothèse, pas traité comme vérité.

### Karim El-Mansouri — facilitateur

Position :

```text
neutre
```

Rôle :

```text
préserver la procédure,
rendre les amendements explicites,
distinguer lecture et décision.
```

### Jordan Roy — étudiant-coordinateur

Position :

```text
sceptique
```

Objection :

> La fonction de coordination peut devenir le travail invisible de l'équipe.

---

## 5. Graphe d'arguments minimal

```text
A014
│
├── POUR
│   ├── feedback plus rapide
│   ├── apprentissage de plusieurs rôles
│   ├── problèmes d'équipe visibles plus tôt
│   └── meilleure traçabilité des contributions
│
├── CONTRE / RISQUES
│   ├── biais social du peer review
│   ├── surcharge du coordinateur
│   ├── charge professorale
│   ├── accessibilité
│   ├── gaming des journaux
│   └── comparabilité des notes
│
└── CONDITIONS / AMENDEMENTS
    ├── rubriques publiques
    ├── appel humain
    ├── revue accessibilité
    ├── revue J30
    └── décision réversible J90
```

---

## 6. Amendement A014.2

```text
A014.2 — Garde-fous de l'évaluation pairs/engagement

La composante pairs/engagement ne peut contribuer
à l'évaluation finale que si :

1. la rubrique est publiée avant le travail;
2. les critères sont contestables;
3. un mécanisme humain d'appel existe;
4. une lecture algorithmique/contextuelle ne détermine
   jamais seule la note;
5. les adaptations d'accessibilité peuvent modifier
   la méthode de collecte de preuve.
```

Cet amendement est important pour la démo : Konnaxion ne sert pas seulement à dire “oui/non”; la délibération **améliore le mandat**.

---

## 7. Baseline et Smart Vote

Les valeurs exactes sont définies dans `05_SEEDS_FIXTURES.md`.

L'UX doit montrer :

```text
Baseline / source participation
        ≠
Smart Vote / advisory reading
```

Le message :

> une lecture contextualisée peut modifier notre compréhension du résultat sans supprimer le résultat source.

---

## 8. Décision UCKK-D009

`SYNTHETIC_FIXTURE`

```text
STATUS
published

OUTCOME
approved_with_conditions

SCOPE
3 sections

TEAM SIZE
4–6

SPRINT
2 semaines

ROTATING ROLES
oui

EVALUATION
50 / 30 / 20

AMENDMENT
A014.2 adopted

CHECKPOINTS
Jour 3
Jour 30
Jour 90

SMART VOTE
considered_not_binding

MINORITY REPORT
preserved
```

---

## 9. Ce qui change au moment de la décision

Avant :

```text
proposition
arguments
stances
lectures
amendements
```

Après publication :

```text
mandat institutionnel
```

C'est la publication de `UCKK-D009`, et non l'existence du Topic Konnaxion, qui rend légitime le handoff à Orgo.

---

## 10. Exécution Orgo

Le Case :

```text
Déploiement — Pilote pédagogique UCKK-A014
```

Familles de travail :

```text
PÉDAGOGIE
- geler la spécification adoptée
- publier rubriques
- publier protocole des rôles

COURS
- sélectionner 3 sections
- configurer activités
- former équipes
- assigner mentors

ÉVALUATION
- mécanisme d'appel
- revue des critères
- procédure de modération

ACCESSIBILITÉ
- revue des chartes
- procédure d'adaptation

PILOTAGE
- checkpoint J3
- revue J30
- dossier J90
```

---

## 11. Jour 3

`SYNTHETIC_FIXTURE`

```text
8 équipes formées
7 chartes acceptées
1 charte en revue d'accessibilité
```

La démo doit montrer :

> décision prise ≠ exécution complète.

---

## 12. Jour 30

`SYNTHETIC_FIXTURE`

```text
6 signalements de déséquilibre de charge
2 demandes de clarification des rubriques
0 modification de politique
```

Orgo peut :

```text
lier les Signals au Case
ouvrir/assigner les Tasks
rendre le pattern visible
publier une mise à jour d'impact
```

Orgo ne peut pas :

```text
changer 50/30/20
modifier A014.2
déclarer le pilote adopté définitivement
```

---

## 13. Jour 90

`SYNTHETIC_FIXTURE`

Observation :

> Le rôle de coordinateur semble absorber une part disproportionnée du suivi dans plusieurs équipes.

La bonne réaction n'est pas :

```text
auto-fix policy
```

La bonne réaction est :

```text
evidence
→ operational review
→ public/accountability update
→ new governance question
```

---

## 14. Follow-up A014-R1

Question :

> **Après un cycle d'expérimentation, UCKK doit-il continuer, modifier, prolonger ou arrêter le pilote?**

Options :

```text
A — continuer sans changement majeur
B — modifier le protocole de rotation
C — modifier les garde-fous d'évaluation
D — prolonger le pilote sans généraliser
E — arrêter le pilote
```

Fin de démo recommandée :

```text
Reconsideration pending
```

La démo se termine donc sur une institution capable d'apprendre, pas sur un “success screen”.
