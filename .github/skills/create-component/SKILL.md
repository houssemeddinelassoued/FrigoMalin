---
name: create-component
description: 'Crée un composant d’interface FrigoMalin (Preact 11 + TypeScript) dans src/components avec son test Vitest. Utiliser dès qu’on demande de créer, ajouter ou générer un composant, un écran ou un élément d’interface.'
---

# Créer un composant FrigoMalin

## Quand utiliser cette skill

Utiliser cette procédure lorsqu’une demande porte sur la création d’un composant, d’un écran ou d’un élément d’interface FrigoMalin. Elle produit le composant Preact et son test de composant Vitest.

## Procédure

1. Déduire un nom de composant en PascalCase et son rôle à partir de la demande. Demander une précision si le nom, le rôle ou le comportement attendu reste ambigu.
2. Avant toute modification, lire les instructions applicables dans `.github/instructions/` et repérer un composant et un test voisins pour reprendre les conventions Preact, TypeScript, CSS et Vitest. Si la demande suppose une autre stack ou contredit les conventions du dépôt, demander confirmation avant de poursuivre.
3. Créer `src/components/<Nom>.tsx` avec un composant fonctionnel Preact 11. Importer les hooks depuis `preact/hooks`, typer les props avec une interface dédiée et ne pas utiliser `preact/compat` ni `any`.
4. Créer le test adjacent `src/components/<Nom>.test.tsx`. Utiliser Vitest et `@testing-library/preact`, importer explicitement les fonctions de Vitest, écrire les noms de tests en français et vérifier le comportement observable avec des rôles et noms accessibles.
5. Ajouter ou réutiliser les styles dans `src/index.css`, selon l’organisation des styles déjà présente. Réutiliser les variables CSS définies dans `:root` quand elles conviennent ; ne pas supposer l’existence de `tokens.css` ni ajouter un système de tokens séparé.
6. Garder la logique métier dans `src/domain/`, jamais dans le composant. Si la demande exige une nouvelle logique métier, l’implémenter dans le domaine et ajouter son test voisin conformément aux règles des tests du projet. Les composants ne doivent pas accéder directement à IndexedDB : utiliser les fonctions de `src/data/`.
7. Exécuter d’abord `npm test -- <Nom>` pour le test ciblé, puis les contrôles exigés par le dépôt : `npm run build`, `npm run lint` et `npm test`. Corriger uniquement les échecs causés par le changement et relancer les commandes concernées jusqu’à leur succès.
8. Répondre en français en listant les fichiers créés ou modifiés et en indiquant le résultat des vérifications, sans recopier leur contenu.