---
description: "Règles pour l'interface FrigoMalin : composants Preact 11, accessibilité, mobile, routage hash, hors ligne."
applyTo: "src/**/*.tsx, src/**/*.css, index.html"
---

# Interface (Preact)

## Composants

- Preact 11 en composants fonctions, hooks importés depuis `preact/hooks`. Ne pas utiliser `preact/compat` (ADR 0002).
- Un composant par fichier, nommé en PascalCase ; props typées par une interface dédiée, sans `any`.
- Les composants n'accèdent jamais directement à IndexedDB : passer par les fonctions de `src/data/`.
- La logique métier (états de date, calculs de quantités) vit dans `src/domain/` ; les composants l'affichent.
- Pas de `dangerouslySetInnerHTML` ; les données Open Food Facts sont affichées comme texte.

## Accessibilité

- HTML sémantique : `main`, `nav`, `h1` unique par vue, listes pour le stock, `button` pour les actions, `a` pour la navigation.
- Chaque champ a un `label` associé ; erreurs de saisie liées par `aria-describedby`.
- Ne jamais transmettre un état uniquement par la couleur : « dépassée », « à consommer bientôt » et « qualité à vérifier » sont écrits en texte.
- Focus visible, ordre de tabulation logique, focus déplacé sur le titre de la vue après navigation.
- Retours d'action (ajout, consommation, erreur réseau) annoncés via une zone `aria-live="polite"`.
- Cibles tactiles d'au moins 44 × 44 px, contraste WCAG AA.

## Mobile et hors ligne

- Mobile d'abord : mise en page conçue pour 390 px de large, sans défilement horizontal.
- Routage hash uniquement (`#/stock`, `#/dates`, `#/consommation`, ADR 0003) ; chemins d'assets relatifs à `/FrigoMalin/`.
- Le scan Open Food Facts est optionnel : en cas d'échec réseau ou de produit inconnu, proposer la saisie manuelle sans bloquer.

## Textes

- Interface en français, vocabulaire du glossaire de `PRODUCT.md` (DLC, DDM, stock, gaspillage évité « estimé »).
- Ne jamais présenter le gaspillage évité comme une mesure vérifiée.
