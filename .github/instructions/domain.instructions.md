---
description: "Règles pour le domaine et les données FrigoMalin : types stricts, dates DLC/DDM, IndexedDB via idb, migrations."
applyTo: "src/domain/**, src/data/**"
---

# Domaine et données

## Domaine (`src/domain/`)

- Code pur : aucune dépendance au DOM, à `idb`, à Preact ni au réseau.
- Types dans `src/domain/types.ts` : unions littérales plutôt que `string`, aucun `any`, `unknown` + validation aux frontières (import JSON, réponses Open Food Facts).
- Fonctions sans effet de bord ; la date du jour est toujours un paramètre (`today: Date`), jamais `new Date()` caché dans la logique.
- Dates : `IsoDate` au format `AAAA-MM-JJ` en heure locale ; utiliser `toIsoDate()` et comparer les chaînes ISO, ne pas passer par `toISOString()` (UTC).
- DLC et DDM ne se traitent pas pareil : DLC passée → « dépassée » ; DLC à 3 jours ou moins → « à consommer bientôt » ; DDM passée → « qualité à vérifier ».
- Les quantités consommées ne dépassent jamais la quantité en stock ; une quantité à 0 passe le statut à `consommé`.
- Gaspillage évité : n'additionner que les consommations déclarées au plus tard à la date renseignée (`beforeExpiry`).

## Données (`src/data/`)

- IndexedDB via `idb` uniquement (ADR 0001) ; accès centralisé par `getDb()`.
- Schéma typé par `FrigoMalinDB` : tout nouveau store ou index y est déclaré.
- Migrations : ne jamais modifier un bloc `if (oldVersion < N)` existant. Incrémenter `DB_VERSION` et ajouter un bloc `if (oldVersion < N + 1)`.
- Regrouper les écritures liées dans une même transaction (ex. consommation + mise à jour du stock).
- Gérer les erreurs d'écriture (`QuotaExceededError`, transaction annulée) et les remonter avec un message exploitable par l'interface.
- Import JSON : valider chaque champ avant écriture ; rejeter le fichier entier si un article est invalide.
- `seed.ts` reste déterministe à date donnée (`today`, `createId` injectables) et n'est jamais chargé en production sans action explicite.
