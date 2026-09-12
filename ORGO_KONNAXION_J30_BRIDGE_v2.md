# Orgo → Konnaxion J30 Impact Bridge v2

Cette version est construite contre le snapshot réel de `Konnaxion_Worlds` fourni le 2026-09-12.

## Frontière

```text
Orgo IntegrationOperation
        ↓ HTTP bridge protocol
Konnaxion provider endpoint
        ↓ Konnaxion service/model
selected WorldRelease.domain_schema
        ↓
ethikos_orgoimpactpublication
        ↓ receipt succeeded
Orgo IntegrationOperation = SUCCEEDED
```

Il n'y a aucun SQL cross-system. Orgo ne connaît pas le schéma PostgreSQL de Konnaxion. Le provider Konnaxion écrit uniquement dans la vérité Konnaxion du World sélectionné.

## Pourquoi `ethikos`

Dans le code actuel, `ethikos` est déjà une app métier appartenant aux schémas Domain des Worlds. L'artefact `OrgoImpactPublication` y est donc ajouté via la migration `0006_orgo_impact_publication` au lieu d'être placé dans le control plane `worlds`.

Le Bridge Manager ne migre que le **current release** du World sélectionné. Les anciens/frozen releases ne sont pas modifiés par l'outil.

## Endpoint provider

Le provider écoute localement par défaut sur :

```text
POST http://127.0.0.1:8011/api/integrations/orgo/konnaxion/{world}/publish/
```

Il exige :

- Bearer token généré en mémoire par le Bridge Manager;
- `Idempotency-Key` cohérent avec le corps Orgo;
- `X-Correlation-ID` cohérent avec le corps Orgo;
- opération `publish` seulement;
- sujet Orgo `case`;
- `artifact_type = impact_update`;
- absence de champs étudiants/privés interdits.

Les retries sont dédupliqués par `operation_id`, `idempotency_key` et `external_reference`. Un replay avec un contenu différent retourne un conflit au lieu d'écraser l'artefact.

## Utilisation

1. Fermer l'ancien worker Orgo (`Ctrl+C`).
2. Lancer `Orgo_Konnaxion_Bridge_Manager.pyw`.
3. `1. Charger Worlds`.
4. Sélectionner le World Konnaxion cible.
5. `2. Démarrer Bridge` — applique la migration uniquement au current release choisi puis démarre le provider local.
6. Coller dans le champ masqué le même `DATABASE_URL` que l'API Orgo.
7. `3. Démarrer worker Orgo`.
8. Dans `Orgo_World_Scenario_Manager.pyw`, relancer `J30 → Injecter TEST`.
9. Vérifier que l'étape 6 `wait_integration` termine et que le scénario retourne `"ok": true`.
10. Cliquer `Vérifier Impact J30`; le résultat attendu est exactement un artefact `impact:UCKK-A014:day30:v1`.
11. Passer à J90 seulement après cette vérification.

Le token bridge et le `DATABASE_URL` ne sont pas écrits dans les logs ni persistés par le Manager.
