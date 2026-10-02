---
description: "Generer un composant Preact type, accessible et teste selon les conventions FrigoMalin."
argument-hint: "Nom PascalCase et comportement attendu du composant"
agent: "agent"
---

# Nouveau composant FrigoMalin

Creer le composant `${input:componentName}` pour le besoin suivant :
${input:requirements}

## Contexte obligatoire

Lire et appliquer les [regles communes](../copilot-instructions.md), les
[regles UI](../instructions/ui.instructions.md) et les
[regles de tests](../instructions/tests.instructions.md).
Consulter le [produit](../../PRODUCT.md) pour le vocabulaire et un composant
voisin dans [src/components](../../src/components/) pour le style et les exports.
Si la demande touche au domaine ou aux donnees, lire aussi les
[regles domaine et donnees](../instructions/domain.instructions.md).

## Realisation

- Verifier que le nom est en PascalCase et que le composant n'existe pas deja.
  Reutiliser ou adapter l'existant si cela repond au besoin sans duplication.
- Si une information indispensable manque, poser une question ciblee avant
  d'implementer ; sinon suivre les conventions locales sans elargir la demande.
- Creer `src/components/<ComponentName>.tsx`, avec un composant fonction
  Preact 11, une interface `<ComponentName>Props` dediee et des types stricts.
  Importer les hooks depuis `preact/hooks`, jamais depuis `preact/compat`.
- Conserver la logique metier dans `src/domain/` et passer par `src/data/`
  pour la persistance. Ne jamais acceder directement a IndexedDB dans le composant.
- Garder les textes visibles en francais et les identifiants en anglais.
  Utiliser le HTML semantique, des noms accessibles, des labels associes,
  un focus visible et des annonces `aria-live` pour les retours d'action.
- Respecter le design existant, les icones `lucide-preact`, le mobile a 390 px,
  les cibles tactiles de 44 px et le mode hors ligne. Reutiliser les styles
  existants dans `src/index.css` ; n'en ajouter que si le besoin l'exige.
- Ne pas ajouter de route, dependance ou integration a l'application sans
  necessite explicite. Si une navigation est requise, utiliser le routage hash
  existant et respecter la base `/FrigoMalin/` pour les assets.
- Ajouter les tests utiles dans `src/components/<ComponentName>.test.tsx`
  avec Vitest et Testing Library : rendu, interactions, etats vides et erreurs
  selon le besoin. Privilegier les roles et noms accessibles ; simuler les
  fonctions de donnees et le reseau, sans appel externe reel.
- Aucun `any`, aucune injection HTML non sure ni modification sans rapport
  avec la demande. Preserver les changements deja presents.

## Verification et retour

Executer d'abord les tests du composant, puis `npm run build`, `npm run lint`
et `npm test` depuis la racine FrigoMalin. Ne pas corriger les echecs sans
rapport ; les signaler en distinguant les echecs preexistants des regressions.
Terminer par un bref resume des fichiers modifies, des props publiques et des
resultats de verification. Ne pas annoncer une verification non executee.