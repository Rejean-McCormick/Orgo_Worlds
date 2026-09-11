# Canon, autorité et frontières

Ce document est la **source de vérité unique** de ce pack pour l'ownership, la souveraineté et les invariants inter-systèmes.

---

## 1. Positionnement de UCKK

`SOURCE_CANON`

UCKK est une **school / learning city**; UCKK-Moodle en est le campus Moodle autonome.

Pour la démo, le vocabulaire recommandé est :

```text
univers-cité expérimentale
experimental learning city
experimental learning environment
internal recognition
UCKK pathway
```

Éviter toute formulation impliquant une accréditation étatique ou universitaire qui n'existe pas.

UCKK n'est pas un simple site public.  
Il contient une logique de cours, apprentissage, défis, Assemblées, Archives et intégrité.

---

## 2. Répartition canonique des responsabilités

| Objet / vérité | Autorité | Lecteurs possibles | Interdit |
|---|---|---|---|
| Topic, argument, stance | Konnaxion | UCKK, public selon politique | alias Orgo |
| consultation ballot | Konnaxion/Konsultations | Konnaxion/UCKK | écraser par Smart Vote |
| baseline | Konnaxion | UCKK | la présenter comme Smart Vote |
| Smart Vote reading | Konnaxion | UCKK | décision finale |
| EkoH signal | Konnaxion | UCKK | pouvoir global automatique |
| Motion | UCKK Assembly | Konnaxion par mapping | devenir Topic par identité |
| décision d'Assemblée | UCKK-Moodle | Orgo/Konnaxion par référence | publication par Smart Vote |
| cours / activité | UCKK-Moodle | exports gouvernés | direct-write externe |
| note / compétence / badge | UCKK-Moodle | exports gouvernés | décision Orgo/Konnaxion |
| archive UCKK | UCKK-Moodle | selon visibilité | mutation externe directe |
| Signal | Orgo | Workflows / UI | Task par définition |
| Case | Orgo | organisation | alias Topic |
| Task | Orgo | organisation | alias consultation |
| WorkflowVersion | Orgo | Orgo | mutation par provider |
| IntegrationOperation | Orgo | Orgo | devenir statut du Case |
| Impact update Konnaxion | Konnaxion | UCKK/public selon règle | devenir preuve académique |
| observation agrégée | source UCKK-Moodle, coordonnée par Orgo | Konnaxion | réécriture de politique |

---

## 3. Invariants non négociables

`SOURCE_CANON`

```text
Orgo Case ≠ Konnaxion Topic
Orgo Task ≠ Konnaxion Consultation
Orgo status ≠ civic/institutional decision status
```

```text
consultation ballot
≠ EthikosStance
≠ Smart Vote reading
≠ Orgo Task
```

```text
Konnaxion computes Smart Vote readings.
UCKK-Moodle owns Assembly decisions.
Archives preserve both, with provenance and contestability.
```

```text
external systems never write Moodle source tables
```

```text
external system state
≠ Orgo Task/Case state by implication
```

---

## 4. Le point d'autorité le plus important

La séquence acceptable est :

```text
Konnaxion
source facts
arguments
baseline
Smart Vote advisory reading
        ↓
UCKK Assembly
human institutional decision
        ↓
Orgo
operational execution
```

La séquence interdite est :

```text
Smart Vote = YES
        ↓
Orgo crée le pilote automatiquement
```

---

## 5. Smart Vote

`SOURCE_CANON`

Smart Vote est une lecture contextualisée déclarée.

La démo doit afficher :

```text
SOURCE PARTICIPATION / BASELINE
         séparément de
SMART VOTE / CONTEXTUAL READING
```

Smart Vote ne doit jamais :

```text
publier une décision d'Assemblée
attribuer une note
valider une compétence
attribuer un badge
fermer une contestation
écraser le ballot/source result
cacher le minority report
```

---

## 6. EkoH

`SOURCE_CANON`

Une expertise/pondération est **contextuelle**.

Exemple :

```text
expertise en accessibilité
→ pertinente pour une question d'accessibilité

expertise en cybersécurité
→ pas automatiquement autorité sur l'évaluation pédagogique
```

Ne jamais présenter une pondération comme propriété universelle de la personne.

---

## 7. Orgo

`SOURCE_CANON` + `IMPLEMENTED_ORGO`

Orgo possède son état opérationnel :

```text
Signal
Case
Task
assignment
routing
escalation
workflow execution
integration operation
receipt reconciliation
```

Orgo peut conclure :

```text
“il y a six signalements de surcharge”
```

Il ne peut pas conclure par autorité :

```text
“la pondération 50/30/20 est maintenant 40/30/30”
```

Ce second énoncé change le mandat institutionnel.

---

## 8. Moodle / UCKK

`SOURCE_CANON`

UCKK-Moodle demeure autonome lorsque Konnaxion est désactivé.

Il conserve l'autorité académique pour :

```text
cours
inscriptions
rôles
capacités
compétences
badges
preuves
portfolios
completion
Assembly decisions
archives
privacy
integrity
reports
```

Konnaxion peut informer.  
Konnaxion ne doit pas devenir une dépendance dure du campus.

---

## 9. Archives

L'Archive doit permettre de reconstruire :

```text
ce qui a été proposé
ce qui a été débattu
ce qui a été calculé
ce qui a été décidé
ce qui a été exécuté
ce qui a été observé
ce qui a été contesté
ce qui a été modifié ensuite
```

Un snapshot Smart Vote et une décision d'Assemblée sont deux artefacts différents.

---

## 10. Règle d'intégration saine

`SOURCE_CANON`

```text
System A
creates request / event / operation
        ↓
System B
authenticates
validates
applies B's rules
mutates B-owned truth
        ↓
receipt / result / event
        ↓
System A
reconciles its own workflow
```

Aucune intégration ne gagne l'autorité métier du provider simplement parce qu'elle peut l'appeler.

---

## 11. Confidentialité

La vertical slice utilise des observations agrégées.

Ne pas transmettre d'UCKK-Moodle vers Orgo/Konnaxion :

```text
noms étudiants
emails
identifiants étudiants
notes brutes
messages privés
contenu privé d'appel
données sensibles inutiles
poids EkoH personnels non destinés à publication
```

Le public peut recevoir :

```text
comptes agrégés
états d'implémentation
références
résumés validés
provenance
```

---

## 12. Test “qui possède quoi?”

Avant d'ajouter une fonction, remplir :

```yaml
object:
created_by:
canonical_owner:
who_can_mutate:
who_can_reference:
authority_gate:
privacy_class:
integration_contract:
failure_semantics:
```

Si `canonical_owner` est ambigu, ne pas implémenter le pont.
