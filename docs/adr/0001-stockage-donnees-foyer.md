# ADR 0001 : Où stocker les données du foyer ?

- **Statut :** Accepté
- **Date :** 2026-10-02

## Contexte et problème

FrigoMalin doit conserver le stock du foyer dans le navigateur, fonctionner hors ligne après le premier chargement et permettre de consulter les aliments triés par DLC ou DDM. L’application est statique, sans backend ni compte. L’export et l’import JSON sont prévus pour permettre à l’utilisateur de sauvegarder et restaurer ses données.

Le stockage doit donc prendre en charge des données structurées et les requêtes par date, sans imposer une dépendance excessive au bundle du POC de cinq jours.

## Facteurs de décision

- Capacité suffisante pour le stock d’un foyer et absence de plafond bas connu.
- Requêtes par index et tri par date.
- Faible taille ajoutée au bundle mobile.
- Facilité de test automatisé et de validation dans un vrai navigateur.
- Compatibilité avec la persistance locale et le fonctionnement hors ligne.

## Options considérées

| Option | Limite de stockage | Requêtes possibles | Taille ajoutée au bundle | Facilité de test |
| --- | --- | --- | --- | --- |
| `localStorage` | 5 MiB par origine pour `localStorage`; le quota Web Storage total est limité à 10 MiB par origine, répartis entre `localStorage` et `sessionStorage`. Une écriture au-delà de la limite peut lever `QuotaExceededError`. | Aucun index ni requête structurée. Il faut lire et désérialiser les données, puis filtrer et trier en mémoire. | 0 kB de bibliothèque. | Très facile pour les tests unitaires de sérialisation et de CRUD. Il faut simuler les erreurs de quota; le tri reste à tester dans la logique applicative. |
| IndexedDB via Dexie.js | Quota géré par le navigateur et variable selon navigateur, appareil et espace disponible. Les données best-effort peuvent être évincées. | Index et requêtes de haut niveau avec `where` et `orderBy`. Le tri par date nécessite que la date soit indexée. Certaines combinaisons de filtre et de tri peuvent demander un index composé ou une requête différente. | Dexie 4.4.6 : environ 93,2 kB minifié et 30,4 kB gzip pour le paquet seul. | Facile : l’API de haut niveau simplifie les tests de requêtes. `fake-indexeddb` peut fournir une IndexedDB en mémoire pour les tests automatisés. |
| IndexedDB via `idb` | Même quota que Dexie, car `idb` est un wrapper de l’API IndexedDB et ne change pas les règles du navigateur. | Index, plages de clés et curseurs de l’API IndexedDB, avec une interface basée sur les promesses. Un index de date permet le tri ascendant ou descendant et la sélection par plage. | `idb` 8.0.3 : environ 3,5 kB minifié et 1,4 kB gzip pour le paquet seul. | Bonne : `fake-indexeddb` fonctionne avec `idb`. Les transactions, index et migrations demandent plus de code explicite qu’avec Dexie. |

Les quotas IndexedDB n’ont pas de valeur portable fixe. Ils dépendent du navigateur et de l’appareil; l’utilisateur peut également effacer les données du site. L’export/import JSON ne remplace donc pas la gestion des erreurs d’écriture ni une information claire sur la conservation locale.

Les tailles indiquées sont des estimations publiées pour les versions nommées, pas une mesure du bundle FrigoMalin. Le dépôt ne possède pas encore de manifeste `package.json` permettant de comparer le build réel.

Sources : [MDN - quotas et critères d’éviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [MDN - `IDBIndex.getAll`](https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/getAll), [Dexie - `Table.orderBy`](https://dexie.org/docs/Table/Table.orderBy()), [idb](https://github.com/jakearchibald/idb), [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB), [Bundlephobia - Dexie 4.4.6](https://bundlephobia.com/package/dexie@4.4.6), [Bundlephobia - idb 8.0.3](https://bundlephobia.com/package/idb@8.0.3).

## Décision

Utiliser **IndexedDB via `idb`** pour les données du foyer. Définir explicitement les object stores et les index nécessaires, notamment ceux utilisés pour afficher le stock par DLC ou DDM. Garder l’export et l’import JSON comme parcours de sauvegarde et de restauration utilisateur.

## Conséquences

### Positives

- Permet de stocker des objets structurés et de requêter le stock par index sans désérialiser l’ensemble des données à chaque lecture.
- Permet le tri par date à l’aide d’un index IndexedDB.
- Ajoute environ 1,4 kB gzip pour `idb`, contre environ 30,4 kB gzip pour Dexie dans les versions comparées.
- `fake-indexeddb` permet de tester en mémoire les opérations et requêtes IndexedDB automatisées.

### Négatives

- L’équipe doit gérer explicitement les transactions, les migrations de schéma et les erreurs d’écriture.
- Les quotas et l’éviction restent sous le contrôle du navigateur. Le stockage local ne constitue pas une sauvegarde; la suppression des données du navigateur peut entraîner leur perte.
- Les tests en mémoire ne valident pas les quotas, l’éviction ou toutes les différences entre navigateurs. Une validation ciblée sur navigateur mobile reste nécessaire.

## Conditions de réexamen

Reconsidérer le choix si les requêtes évoluent vers de nombreux filtres combinés ou si les migrations et transactions explicites ralentissent sensiblement le développement; comparer alors le gain d’ergonomie de Dexie à son coût dans le bundle réel. Réexaminer également la taille après l’intégration au build, ou si l’équipe doit prendre en charge la synchronisation multi-appareil, actuellement hors périmètre.
