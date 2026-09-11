# Tests, acceptance et Definition of Done

---

## 1. Test canonique d'autorité

```text
Given Smart Vote is favorable
And UCKK-D009 is not published
When Orgo demo state is inspected
Then no A014 Case exists
```

C'est le test conceptuel le plus important.

---

## 2. Test décision → Signal

```text
Given UCKK-D009 is publishable
When an authorized Assembly actor publishes it
Then exactly one Orgo Signal is accepted
And the Signal references UCKK-D009
And the payload says human_institutional_decision
And no raw student PII is present
```

---

## 3. Test d'idempotence inbound

```text
Given decision D009 was already handed off
When the identical handoff is replayed
Then no second business consequence is created
```

Variante :

```text
same external_reference
different normalized payload
→ conflict, not silent mutation
```

Aligné sur les invariants Orgo documentés.

---

## 4. Test simulation

```text
Given Signal S1
When workflow version W1 is simulated
Then proposed actions are deterministic
And no Case exists
And no Task exists
And no IntegrationOperation exists
```

---

## 5. Test execute

```text
When the same Signal is executed with W1
Then one Case exists
And the expected Tasks exist
And the WorkflowInstance identifies W1
```

---

## 6. Test J30

```text
Given Case A014 is active
When the J30 observation fixture is received
Then the Signal is persisted
And it links/enriches the A014 operational context
And no UCKK policy is automatically modified
```

---

## 7. Test bridge

```text
Given a Konnaxion publish IntegrationOperation
When provider returns accepted
Then operation remains non-terminal

When authenticated final receipt returns succeeded
Then IntegrationOperation reconciles as succeeded
And exactly one Impact artifact exists
```

---

## 8. Test business semantics

```text
IntegrationOperation = succeeded
MUST NOT imply
UCKK decision = approved
```

```text
Task = completed
MUST NOT imply
pilot = successful
```

---

## 9. Test privacy

Outbound observation payload MUST NOT contain :

```text
student name
email
student ID
raw grade
private message
appeal body
medical/private accommodation details
```

---

## 10. Test outage Konnaxion

```text
Given Konnaxion bridge unavailable
When Orgo publishes J30 impact
Then Case remains valid
And Work remains editable under normal rules
And operation is retryable/failed according to policy
And no fake Konnaxion publication is shown
```

---

## 11. Test redrive

```text
Given failed/retryable publish
When bridge returns
And the operation is redriven
Then exactly one Impact artifact exists
```

---

## 12. Test reset

Après reset :

```text
clock = T-14
D009 published = false
A014 Orgo Case = absent
Impact J30 = absent
A014-R1 visible = false
```

Le reset doit être déterministe.

---

## 13. Test de visibilité épistémique

Toute fixture J3/J30/J90 doit afficher :

```text
DEMO FIXTURE
```

Toute baseline/Smart Vote synthétique doit afficher :

```text
DEMO DATA
```

---

## 14. Test de démo non-fondateur

Un opérateur muni uniquement du runbook doit pouvoir :

```text
reset
ouvrir A014
montrer Konnaxion
publier D009
montrer le Signal
simuler
exécuter
avancer J30
publier Impact
avancer J90
ouvrir R1
```

sans :

```text
SQL manuel
édition de base
UUID mémorisé
commande non documentée
intervention du fondateur
```

---

## 15. Scorecard

| Dimension | Cible |
|---|---:|
| autorité compréhensible | 100 % |
| replay inbound sans duplication | pass |
| replay outbound sans duplication | pass |
| simulation sans mutation | pass |
| provenance cross-system | pass |
| PII brute dans payload public | 0 |
| faux succès lors d'outage | 0 |
| reset déterministe | pass |
| gold path non-fondateur | pass |
| claims synthétiques non marqués | 0 |

---

## 16. Definition of Done

> À partir d'un sandbox T-14, un opérateur non-fondateur peut montrer la délibération A014 dans Konnaxion, distinguer source participation et Smart Vote, revenir à l'Assemblée UCKK, publier une décision humaine D009, observer exactement un Signal Orgo, simuler le workflow sans mutation, exécuter Case et Tasks, avancer aux observations J3/J30, publier un Impact via l'IntegrationOperation Konnaxion avec idempotency/correlation/receipt visibles, avancer à J90, montrer un problème réel de la fixture sans le présenter comme résultat scientifique, ouvrir A014-R1, et terminer avec la prochaine décision encore sous l'autorité UCKK.

Si ce texte est vrai et reproductible, la vertical slice est done.
