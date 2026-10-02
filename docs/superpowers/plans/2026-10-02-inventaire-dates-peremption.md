# Inventaire et dates de péremption : plan d'implémentation

**Objectif :** permettre l'ajout, la modification et la suppression manuels des aliments, avec une date facultative et des états DLC/DDM distincts.

**Architecture :** logique pure dans `src/domain/`, persistance IndexedDB via `idb` dans `src/data/`, interface Preact dans les composants existants. Réutiliser les tests et les index déjà présents, sans backend ni nouveau store.

**Technologies :** TypeScript strict, Preact 11, Vite, `idb`, Vitest, Testing Library, `fake-indexeddb`, Playwright.

**Statut :** plan uniquement. Les commandes ci-dessous sont des critères de validation futurs, pas des résultats obtenus. La sauvegarde de ce document n'autorise pas l'implémentation, la création de branches ou de commits.

## Sources et périmètre

Le dépôt des issues est [houssemeddinelassoued/FrigoMalin](https://github.com/houssemeddinelassoued/FrigoMalin). Le remote local observé pointe vers `zerogaspi` : ne pas le modifier implicitement.

Il n'existe pas d'epic portant exactement le titre « Inventaire et dates de péremption ». La feature est répartie entre :

- [Epic #5 : Gérer le stock alimentaire](https://github.com/houssemeddinelassoued/FrigoMalin/issues/5), avec les sous-issues [#15 : Ajouter un aliment au stock](https://github.com/houssemeddinelassoued/FrigoMalin/issues/15) et [#6 : Modifier ou supprimer un aliment](https://github.com/houssemeddinelassoued/FrigoMalin/issues/6).
- [Epic #3 : Distinguer les états DLC et DDM](https://github.com/houssemeddinelassoued/FrigoMalin/issues/3), avec les sous-issues [#8 : Repérer les DLC dépassées ou proches](https://github.com/houssemeddinelassoued/FrigoMalin/issues/8) et [#7 : Interpréter une DDM distinctement](https://github.com/houssemeddinelassoued/FrigoMalin/issues/7).

Références locales depuis ce document :

- [docs/mvp.md](../../mvp.md) : ligne d'inventaire manuel, complétée par les règles d'états de date.
- [PRODUCT.md](../../../PRODUCT.md) : vocabulaire, parcours et exclusions du POC.
- [ADR 0001](../../adr/0001-stockage-donnees-foyer.md) : choix IndexedDB via `idb`, index de date et erreurs de stockage.
- [src/domain/types.ts](../../../src/domain/types.ts) : modèle actuel.
- [Instructions communes](../../../.github/copilot-instructions.md), [domaine et données](../../../.github/instructions/domain.instructions.md), [interface](../../../.github/instructions/ui.instructions.md) et [tests](../../../.github/instructions/tests.instructions.md).

Aucun backlog utilisé. Les epics PWA hors ligne et consommation restent hors périmètre, sauf les adaptations nécessaires pour ne pas régresser lorsque la date devient facultative. La conservation après rechargement constitue une vérification de l'intégration de l'inventaire, sans prétendre couvrir entièrement l'epic de persistance.

## Contraintes et décisions

- Chaque tâche dure au maximum 20 minutes, validation comprise, et suit l'ordre tests du domaine, domaine, accès aux données, interface, E2E.
- Représenter une date absente par `expiresOn: IsoDate | null`, sans date fictive. Conserver l'union `DateKind` existante.
- Aucun état de péremption calculé pour un aliment non daté ; les non-datés apparaissent après les aliments datés, quel que soit le sens du tri.
- Une DLC passée est « dépassée » ; aujourd'hui et J+3 sont « à consommer bientôt » ; J+4 n'est pas urgent. Une DDM passée est « qualité à vérifier ».
- Une date renseignée doit être une vraie date calendaire au format ISO local `AAAA-MM-JJ`.
- Domaine pur, sans DOM, Preact, IndexedDB ou réseau ; injecter `today: Date` dans la logique qui dépend du jour.
- TypeScript strict, aucun `any` ni assertion de type destinée à forcer une fixture. Identifiants en anglais, textes et tests en français.
- Les composants utilisent les fonctions de `src/data/`, jamais IndexedDB directement. Réutiliser le formulaire et les composants existants.
- IndexedDB via `idb`, accès centralisé par `getDb()`. Réutiliser l'index `expiresOn` ; les entrées à clé `null` n'y figurent pas et doivent être incluses séparément dans le chargement.
- Aucun nouveau store ou index prévu. Ne pas modifier le bloc de migration v1 ; les anciennes dates restent valides. Si un changement de schéma devient nécessaire, incrémenter `DB_VERSION` et ajouter une migration.
- Modifier un article conserve son identité ; un identifiant absent doit provoquer une erreur sans création implicite.
- Supprimer un article est distinct de « déclarer jeté ». Conserver les consommations historiques lors de la suppression.
- Une consommation sans date ne compte pas dans l'estimation : `beforeExpiry` vaut `false`.
- Erreurs liées aux champs par `aria-describedby`, retours annoncés, focus visible et restauré, commandes tactiles de 44 × 44 px minimum.
- Tests à date locale fixe, `fake-indexeddb` avec `closeDb()` entre les tests, aucun appel réel à Open Food Facts.
- E2E sur le build servi par `vite preview`, projet `mobile-chromium`, viewport 390 × 844, navigation relative à `/FrigoMalin/` avec routage hash.

## Commandes et preuve

Exécuter les commandes depuis la racine du projet. Les libellés utilisés avec `-t` ou `--grep` sont les noms à donner aux groupes ou aux tests ajoutés ; une commande qui ne sélectionne aucun test n'est pas une preuve.

Pour les tâches 1 à 3, la preuve initiale est un échec attendu sur une assertion métier, jamais une erreur de syntaxe ou d'import. Les mêmes tests doivent ensuite passer aux tâches 4 à 6. Les gates globaux sont exécutés une fois les adaptations inter-couches terminées.

## 1. Tests du domaine

### Tâche 1 : validation de l'inventaire — 15 minutes

- [ ] Ajouter les tests de validation dans `src/domain/stock.test.ts`.
- **Scénario Gherkin :** Étant donné un nom vide, une quantité nulle, négative ou non finie, ou une date impossible ; Quand je valide ; Alors l'aliment est rejeté.
- **Stories :** #15, #7.
- **Commande :** `npm test -- src/domain/stock.test.ts -t "validation inventaire"`.

### Tâche 2 : frontières DLC/DDM et absence de date — 15 minutes

- [ ] Compléter les tests dans `src/domain/stock.test.ts` avec `new Date(2026, 9, 2)`.
- **Scénario Gherkin :** Étant donné aujourd'hui fixé au 02/10/2026 ; Quand j'évalue une DLC passée, aujourd'hui, J+3, J+4, une DDM passée et une absence de date ; Alors les états sont distincts, ou absents.
- **Stories :** #8, #7.
- **Commande :** `npm test -- src/domain/stock.test.ts -t "dates inventaire"`.

### Tâche 3 : tri et non-régression des parcours voisins — 15 minutes

- [ ] Ajouter les tests dans `src/domain/stock.test.ts` et `src/domain/recipes.test.ts`.
- **Scénario Gherkin :** Étant donné un stock mixte ; Quand je trie ou consomme un aliment non daté ; Alors le tri ne mute pas l'entrée, les non-datés restent en dernier et leur consommation n'alimente pas l'estimation. Les recettes ne traitent pas un article non daté comme une DLC dépassée.
- **Stories :** #8, #7 ; protection des parcours existants.
- **Commande :** `npm test -- src/domain/stock.test.ts src/domain/recipes.test.ts`.

## 2. Domaine

### Tâche 4 : modèle de date facultative et validation pure — 20 minutes

- [ ] Adapter `src/domain/types.ts` et ajouter la validation pure dans `src/domain/stock.ts`.
- **Scénario Gherkin :** Étant donné un aliment valide sans date ; Quand je valide ; Alors il est accepté. Une date renseignée doit être une vraie date calendaire ISO locale.
- **Stories :** #15, #7.
- **Commande :** `npm test -- src/domain/stock.test.ts -t "validation inventaire"`.

### Tâche 5 : états, libellés et consommation sans date — 20 minutes

- [ ] Adapter `expiryState`, `dateLabel` et `consumeItem` dans `src/domain/stock.ts`.
- **Scénario Gherkin :** Étant donné un aliment sans date ; Quand je consulte ou consomme ; Alors aucun état de péremption n'est inventé et `beforeExpiry` vaut `false`. Les règles DLC/DDM existantes restent valides.
- **Stories :** #8, #7 ; protection du calcul de consommation.
- **Commande :** `npm test -- src/domain/stock.test.ts`.

### Tâche 6 : tri et priorité centralisés — 15 minutes

- [ ] Centraliser tri et priorité dans `src/domain/stock.ts` ; adapter les comparaisons nullable des fixtures dans `src/data/seed.test.ts`.
- **Scénario Gherkin :** Étant donné des dates désordonnées et absentes ; Quand je trie ; Alors les dates suivent l'ordre demandé, les non-datés restent en dernier et ne sont pas urgents.
- **Stories :** #8, #7.
- **Commande :** `npm test -- src/domain/stock.test.ts src/domain/recipes.test.ts src/data/seed.test.ts`.

## 3. Accès aux données

### Tâche 7 : ajout validé et réouverture — 20 minutes

- [ ] Adapter `src/data/stock.ts` et compléter `src/data/stock.test.ts`.
- **Scénario Gherkin :** Étant donné un aliment sans date ; Quand je l'ajoute puis ferme et rouvre la base ; Alors tous ses champs sont conservés. Un aliment invalide n'est pas écrit.
- **Story :** #15.
- **Commande :** `npm test -- src/data/stock.test.ts -t "ajout inventaire"`.

### Tâche 8 : modification transactionnelle — 20 minutes

- [ ] Ajouter la modification dans `src/data/stock.ts` et ses tests dans `src/data/stock.test.ts`.
- **Scénario Gherkin :** Étant donné un article existant ; Quand je modifie ses champs ; Alors son identité est conservée. Un identifiant absent provoque une erreur sans création implicite.
- **Story :** #6.
- **Commande :** `npm test -- src/data/stock.test.ts -t "modification inventaire"`.

### Tâche 9 : suppression distincte de la déclaration de perte — 15 minutes

- [ ] Ajouter la suppression dans `src/data/stock.ts` et ses tests dans `src/data/stock.test.ts`.
- **Scénario Gherkin :** Étant donné un article ; Quand je le supprime ; Alors il disparaît du stock sans effacer les consommations historiques. Un article absent est signalé.
- **Story :** #6.
- **Commande :** `npm test -- src/data/stock.test.ts -t "suppression inventaire"`.

### Tâche 10 : lecture indexée et erreurs de stockage — 20 minutes

- [ ] Adapter le chargement et les erreurs dans `src/data/stock.ts` et `src/data/stock.test.ts`.
- **Scénario Gherkin :** Étant donné un stock mixte ou une écriture annulée ou un quota dépassé ; Quand je charge ou enregistre ; Alors aucun article n'est perdu et l'échec est remonté sans succès fictif.
- **Détail :** lire les articles datés via l'index `expiresOn`, inclure séparément les non-datés sans doublons, et remonter un message exploitable pour les erreurs d'écriture.
- **Stories :** #15, #6 ; contrainte ADR 0001.
- **Commande :** `npm test -- src/data/stock.test.ts`.

## 4. Interface

### Tâche 11 : ajout manuel sans date et erreurs accessibles — 20 minutes

- [ ] Adapter `src/components/ScannerView.tsx` et compléter `src/app.test.tsx`.
- **Scénario Gherkin :** Étant donné le formulaire manuel ; Quand je valide sans date ou avec un champ invalide ; Alors l'ajout réussit sans date, ou une erreur liée au champ bloque l'ajout.
- **Stories :** #15, #7.
- **Commande :** `npm test -- src/app.test.tsx -t "ajout inventaire"`.

### Tâche 12 : édition avec formulaire réutilisé — 20 minutes

- [ ] Brancher l'édition dans `src/app.tsx`, `src/components/ScannerView.tsx` et `src/components/StockView.tsx` ; tester dans `src/app.test.tsx`.
- **Scénario Gherkin :** Étant donné un article ; Quand j'ouvre Modifier et valide ; Alors ses champs sont préremplis puis actualisés. Annuler ne change rien.
- **Story :** #6.
- **Commande :** `npm test -- src/app.test.tsx -t "modification inventaire"`.

### Tâche 13 : suppression avec confirmation — 15 minutes

- [ ] Brancher la suppression dans `src/app.tsx` et `src/components/StockView.tsx` ; tester dans `src/app.test.tsx`.
- **Scénario Gherkin :** Étant donné une suppression demandée ; Quand je confirme ou annule ; Alors l'article disparaît ou reste inchangé, avec retour annoncé et focus restauré.
- **Story :** #6.
- **Commande :** `npm test -- src/app.test.tsx -t "suppression inventaire"`.

### Tâche 14 : badges, tri et compteurs issus du domaine — 20 minutes

- [ ] Utiliser les fonctions du domaine dans `src/components/StockView.tsx` et `src/app.tsx` ; tester dans `src/app.test.tsx`.
- **Scénario Gherkin :** Étant donné une DLC passée, une DLC proche, une DDM passée et un article non daté ; Quand j'affiche le stock ; Alors les états textuels sont corrects et le non-daté n'est pas urgent.
- **Stories :** #8, #7.
- **Commande :** `npm test -- src/app.test.tsx -t "dates inventaire"`.

### Tâche 15 : échecs d'enregistrement et ergonomie — 15 minutes

- [ ] Compléter `src/app.test.tsx` et effectuer uniquement les ajustements nécessaires dans `src/index.css`.
- **Scénario Gherkin :** Étant donné une sauvegarde impossible ; Quand je valide ; Alors la dernière valeur enregistrée reste visible, l'erreur est annoncée et les commandes restent accessibles.
- **Stories :** #15, #6 ; contrainte de stockage local.
- **Commande :** `npm test -- src/app.test.tsx`.

## 5. Tests E2E

### Tâche 16 : parcours CRUD mobile — 20 minutes

- [ ] Ajouter le parcours dans `e2e/app.spec.ts`.
- **Scénario Gherkin :** Étant donné un stock vide ; Quand j'ajoute sans date, modifie la quantité puis supprime ; Alors chaque valeur et la disparition finale sont vérifiées.
- **Stories :** #15, #6 ; critère de succès de la ligne inventaire du MVP.
- **Commande :** `npm run test:e2e -- --project=mobile-chromium --grep "inventaire CRUD"`.

### Tâche 17 : états et tri à date fixe — 15 minutes

- [ ] Ajouter le parcours dans `e2e/app.spec.ts`, avec `page.clock.setFixedTime(new Date(2026, 9, 2, 12))`.
- **Scénario Gherkin :** Étant donné le 02/10/2026 et un stock mixte ; Quand je consulte et inverse le tri ; Alors les libellés DLC/DDM et la position des non-datés sont corrects.
- **Stories :** #8, #7.
- **Commande :** `npm run test:e2e -- --project=mobile-chromium --grep "inventaire dates"`.

### Tâche 18 : erreurs utilisateur et article disparu — 20 minutes

- [ ] Ajouter les parcours dans `e2e/app.spec.ts`.
- **Scénario Gherkin :** Étant donné un formulaire invalide ou un article supprimé entre-temps ; Quand je valide ; Alors une erreur compréhensible apparaît sans modification du stock.
- **Stories :** #15, #6, #7.
- **Commande :** `npm run test:e2e -- --project=mobile-chromium --grep "inventaire erreurs"`.

### Tâche 19 : conservation après rechargement — 15 minutes

- [ ] Ajouter le parcours dans `e2e/app.spec.ts`.
- **Scénario Gherkin :** Étant donné un article modifié puis un autre supprimé ; Quand je recharge ; Alors la modification subsiste et l'article supprimé reste absent, sans débordement à 390 × 844.
- **Stories :** #15, #6 ; vérification de l'intégration IndexedDB.
- **Commande :** `npm run test:e2e -- --project=mobile-chromium --grep "inventaire persistance"`.

### Tâche 20 : validation finale — 15 minutes

- [ ] Exécuter les gates obligatoires. Aucun fichier supplémentaire prévu.
- **Scénario Gherkin :** Étant donné les quatre stories couvertes ; Quand j'exécute les contrôles ; Alors build, lint, tests unitaires et E2E réussissent.
- **Commandes, chacune doit réussir :**

```sh
npm run build
npm run lint
npm test
npm run test:e2e
```

## Vérification des instructions et écarts

Le plan respecte TypeScript strict sans `any`, domaine pur avec `today` injecté, tests français à date locale fixe, `fake-indexeddb` avec `closeDb()`, composants Preact sans accès direct à IndexedDB, accessibilité et E2E sur build mobile sous `/FrigoMalin/`.

- **Date obligatoire actuellement :** incompatible avec le MVP et les stories #15/#8. Corrigé par les tâches 1, 2, 4, 5, 7 et 11.
- **Modification et suppression absentes :** « déclaré jeté » ne satisfait pas #6. Corrigé par les tâches 8, 9, 12, 13 et 16.
- **Tri métier dans l'interface et lecture sans index de date :** à replacer dans les couches prévues, tâches 3, 6, 10 et 14.
- **Nom du helper de date :** les instructions demandent `toIsoDate()`, mais le domaine expose `localDate()`. Harmoniser dans la tâche 5 en conservant la compatibilité des appels existants.
- **Migration :** aucun nouveau store ou index nécessaire ; ne pas modifier le bloc v1. Vérifier que les anciens articles datés restent lisibles lors de la tâche 7.
- **PWA hors ligne :** relève de l'epic #2, pas de ces epics. Ce plan ne prétend pas satisfaire cette exigence globale du MVP et ne prévoit pas d'ajout de service worker.
- **Décisions complémentaires :** non-datés en dernier, conservation des consommations historiques et confirmation de suppression sont des choix d'implémentation proposés, non des critères explicitement écrits dans les stories.

Les tests des couches données et interface sont écrits avant leur implémentation locale, au sein de chaque tâche. Les tâches 1 à 3 constituent la phase rouge dédiée au domaine ; elles ne sont pas des gates verts intermédiaires.