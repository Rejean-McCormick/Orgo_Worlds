# UX + runbook de démonstration

Ce document remplace les anciens storyboard et runbook séparés.

La règle : **une histoire, cinq surfaces principales, un seul fil narratif.**

---

## 1. Navigation narrative

Ne pas dire :

```text
“voici Konnaxion”
“voici Orgo”
“voici Moodle”
```

Dire :

```text
“la communauté doit comprendre la proposition”
“l'institution doit maintenant décider”
“la décision doit maintenant devenir du travail”
“le travail rencontre la réalité”
“le réel doit maintenant revenir vers la décision suivante”
```

---

## 2. Surface 1 — UCKK

### Écran

```text
Univers-Cité King Klown
Assemblée pédagogique

A014 — Pilote pédagogique expérimental

État
Délibération en cours

Question
Devons-nous tester ce modèle pendant une session
dans trois sections?

Documents
Mémoire
Annexes
Conditions du pilote

[ Examiner la délibération ]
```

### Message

> UCKK est l'institution concernée. La proposition existe avant le vote et avant le travail.

---

## 3. Surface 2 — Konnaxion

### Écran

```text
UCKK-A014
Pilote pédagogique expérimental

ARGUMENTS
+ feedback précoce
+ expérience de plusieurs rôles

OBJECTIONS
- biais du peer review
- surcharge du coordinateur
- charge d'encadrement
- accessibilité

AMENDEMENT
A014.2 — garde-fous d'évaluation

BASELINE
source participation
58 / 29 / 13
DEMO DATA

SMART VOTE
advisory reading
approve_with_conditions
DEMO DATA

Minority positions
visible
```

### Moment essentiel

Afficher **simultanément** :

```text
baseline
smart vote
```

### Message

> La lecture enrichie ne remplace pas la participation source.

---

## 4. Surface 3 — UCKK Decision

```text
UCKK-A014

DECISION
NOT YET PUBLISHED

Baseline reviewed
✓

Smart Vote considered
✓ non-binding

Minority report preserved
✓

Amendment A014.2
✓

[ Publish institutional decision ]
```

Le présentateur clique.

Puis :

```text
UCKK-D009
PUBLISHED

Outcome
approved with conditions

Authority
UCKK Assembly

Archive
UCKK-ARCH-A014-D009

[ Follow implementation ]
```

### Message

> Jusqu'ici, Orgo n'avait rien à exécuter. Maintenant seulement, il existe un mandat.

---

## 5. Surface 4 — Orgo

### Signal

Montrer brièvement :

```text
Signal
source = API
external_reference = uckk:assembly:A014:decision:D009:v1
correlation = corr:uckk:A014:D009

Authority payload
human_institutional_decision
```

### Simulation

```text
SIMULATION

Would create:
1 Case
4 Tasks
metadata bindings

Persisted Work changes:
0
```

### Message

> Orgo sépare l'évaluation du workflow et l'exécution des effets.

### Execute

Exécuter.

### Case

```text
CASE
UCKK Pedagogical Pilot A014

Source
UCKK-D009

Authority
UCKK Assembly

Correlation
corr:uckk:A014:D009

STATUS
in_progress

COMPLETED
✓ Freeze pilot specification
✓ Prepare rubrics

IN PROGRESS
● Accessibility review
● Course configuration

PENDING
○ Day-30 review
○ Day-90 package
```

Le haut du Case doit afficher le mandat et l'autorité avant la liste de tâches.

---

## 6. Surface 5 — UCKK-Moodle evidence

Cette surface est courte.

```text
UCKK-Moodle
Pilot Evidence

Sections           3
Teams              8
Charters accepted  7
Accessibility      1 open review

EXPORT POLICY
✓ aggregates
✓ source references
✗ names
✗ raw grades
✗ private messages
```

### Message

> Moodle conserve la vérité académique. Orgo reçoit uniquement le signal nécessaire à la coordination.

---

## 7. Jump Jour 30

Action :

```text
demo clock set J30
```

Orgo :

```text
Signals
● workload imbalance ×6
● rubric clarification ×2

Policy changes
0
```

### Message

> Orgo découvre un problème. Il ne gagne pas pour autant le droit de changer la politique.

---

## 8. Publish Impact

Orgo crée une IntegrationOperation :

```text
provider
Konnaxion

operation
publish

status
RUNNING
```

Provider :

```text
accepted
```

Puis callback :

```text
succeeded
```

### Message technique

> “accepted” signifie accepté durablement, pas publié avec succès par implication; le receipt final ferme l'opération.

---

## 9. Retour Konnaxion — Impact

```text
UCKK-A014
Impact / accountability

Decision
approved_with_conditions

Day 3
teams operational
1 accessibility review

Day 30
workload imbalance reports: 6
rubric clarification: 2

Source
Orgo / UCKK-Moodle

Status
DEMO FIXTURE
```

---

## 10. Jour 90

```text
Coordinator-role burden
appears repeatedly

No automatic policy change.

[ Open reconsideration ]
```

Konnaxion :

```text
A014-R1

Continue?
Modify?
Extend?
Stop?
```

Retour UCKK :

```text
RECONSIDERATION PENDING
```

Fin.

---

# SCRIPT 5 MINUTES

## 0:00–0:35 — UCKK

> UCKK veut tester une nouvelle pédagogie. La question appartient à une institution avant d'appartenir à un outil.

## 0:35–1:25 — Konnaxion

> La communauté structure arguments, objections et conditions. La baseline reste visible; Smart Vote est une lecture séparée.

## 1:25–2:00 — UCKK Decision

> L'Assemblée considère ces informations et prend elle-même la décision.

Publier.

## 2:00–3:10 — Orgo

> Maintenant seulement, la décision devient un Signal. Orgo transforme le mandat en travail traçable.

Montrer simulate puis execute.

## 3:10–4:10 — J30

> Le pilote produit des observations. Orgo coordonne leur traitement mais ne change pas la règle.

## 4:10–5:00 — Impact et follow-up

> Le réel revient dans Konnaxion. La prochaine décision reste à prendre par UCKK.

Clôture :

> **La décision ne disparaît pas après le vote : elle rencontre le réel puis revient nourrir la prochaine décision.**

---

# SCRIPT 20 MINUTES

1. contexte UCKK;
2. documents source;
3. graphe d'arguments;
4. amendement;
5. baseline;
6. Smart Vote;
7. minority report;
8. décision UCKK;
9. Signal Orgo;
10. simulation;
11. exécution;
12. Case;
13. preuve Moodle;
14. J3;
15. J30;
16. IntegrationOperation;
17. `accepted`;
18. receipt `succeeded`;
19. Impact;
20. J90;
21. follow-up A014-R1;
22. reconsidération UCKK.

---

# MOMENTS “WOW”

## Wow conceptuel

```text
Orgo détecte un problème
mais refuse implicitement de devenir législateur.
```

## Wow transparence

```text
baseline visible
+
Smart Vote visible
+
minority visible
+
human decision visible
```

## Wow technique

```text
simulate
→ 0 mutation

execute
→ Case + Tasks

replay same handoff
→ no duplicate business effect
```

## Wow résilience

Optionnel :

```text
bridge Konnaxion down
→ Orgo Work intact
→ publication non falsifiée
→ redrive
→ one impact only
```

---

# CHECKLIST PRÉSENTATEUR

```text
[ ] reset = T-14
[ ] D009 absent
[ ] Orgo Case absent
[ ] A014 Topic loads
[ ] baseline loads
[ ] Smart Vote loads
[ ] demo labels visible
[ ] publish permission works
[ ] service account cannot become Assembly authority
[ ] /signals healthy
[ ] workflow version pinned
[ ] simulation snapshot passes
[ ] bridge configured
[ ] J30 Impact absent
[ ] receipt callback healthy
[ ] follow-up hidden
[ ] fallback screenshots available
```

---

# RÈGLE DE SCÈNE

Si une capacité n'est pas live :

```text
dire qu'elle est seedée ou simulée
```

Ne jamais transformer un gap d'intégration en illusion de produit fini.
