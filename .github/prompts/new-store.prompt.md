---
description: "Generer un module de donnees IndexedDB type et teste selon les conventions FrigoMalin."
argument-hint: "Nom du module, entites, operations et contraintes de persistance"
agent: "agent"
---

# Nouveau store de donnees FrigoMalin

Creer le module de donnees `${input:storeName}` pour le besoin suivant
(entites, champs, operations, contraintes et index eventuels) :
${input:requirements}

Un store designe ici un module de persistance dans `src/data/`, et non un
store d'etat global Preact. Ajouter un object store IndexedDB uniquement
si les donnees demandees ne peuvent pas utiliser le schema existant.

## Contexte obligatoire

Lire et appliquer les [regles communes](../copilot-instructions.md), les
[regles domaine et donnees](../instructions/domain.instructions.md) et les
[regles de tests](../instructions/tests.instructions.md).
Examiner le [module stock](../../src/data/stock.ts), la
[base IndexedDB](../../src/data/db.ts), les
[types du domaine](../../src/domain/types.ts) et les
[tests de persistance](../../src/data/stock.test.ts) avant d'implementer.

## Realisation

- Verifier le nom du module et reutiliser les types, fonctions et object stores
  existants lorsque cela evite une duplication. Si une information indispensable
  manque, poser une question ciblee ; ne pas inventer de champs ou d'operations.
- Creer `src/data/<storeName>.ts` avec des fonctions asynchrones exportees,
  des parametres et retours explicitement types, selon le style de `stock.ts`.
  Ne pas ajouter de bibliotheque d'etat global, backend ou synchronisation distante.
- Centraliser l'acces a IndexedDB via `getDb()` et utiliser `idb` uniquement.
  Declarer tout nouveau store ou index dans `FrigoMalinDB`.
- Si le schema change, incrementer `DB_VERSION` et ajouter une migration
  `if (oldVersion < N)` pour cette nouvelle version. Ne jamais modifier un
  bloc de migration existant ni supprimer les donnees deja stockees.
- Placer les types metier dans `src/domain/types.ts` et la logique pure dans
  `src/domain/`. Utiliser des unions litterales, jamais `any` ; valider les
  donnees externes a partir de `unknown` avant toute ecriture.
- Regrouper les ecritures liees dans une transaction et attendre
  `transaction.done`. Gerer l'annulation et les erreurs d'ecriture, dont
  `QuotaExceededError`, avec des messages francais exploitables par l'interface.
- Injecter `today: Date` dans les calculs de dates, reutiliser `toIsoDate()`
  en heure locale et respecter les regles DLC/DDM et de quantites si concernees.
  Ne pas introduire de date courante cachee dans la logique metier.
- Ajouter les tests utiles dans `src/data/<storeName>.test.ts` avec Vitest
  et `fake-indexeddb`, en suivant les helpers existants et en appelant `closeDb()`
  entre les tests. Couvrir les operations demandees, les cas invalides et
  l'atomicite des ecritures liees ; si le schema change, verifier la migration
  depuis la version precedente et la conservation des donnees.
- Noms de tests en francais, fixtures completes et typees sans `any` ni
  assertions `as` forcees, dates locales fixes, aucun appel reseau reel.
- Preserver les changements deja presents et limiter les modifications au besoin.

## Verification et retour

Executer d'abord les tests du module, puis `npm run build`, `npm run lint`
et `npm test` depuis la racine FrigoMalin. Ne pas corriger les echecs sans
rapport ; les signaler en distinguant les echecs preexistants des regressions.
Terminer par un bref resume des fichiers modifies, de l'API publique, des
eventuelles migrations et des resultats de verification. Ne pas annoncer
une verification non executee.