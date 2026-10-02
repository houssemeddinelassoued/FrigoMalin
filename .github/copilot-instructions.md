# FrigoMalin : règles communes

PWA statique (Vite + Preact 11 + TypeScript strict), publiée sur GitHub Pages sous `/FrigoMalin/`, sans backend. Cadrage : `PRODUCT.md`, `docs/mvp.md`, décisions dans `docs/adr/`.

- Code TypeScript propre, lisible et sécurisé ; aucun `any`, unions littérales plutôt que `string`.
- Commentaires courts, seulement pour ce que le code ne dit pas.
- Respecter la structure : `src/domain/` (logique pure), `src/data/` (IndexedDB), composants dans `src/`, tests e2e dans `e2e/`.
- Textes et noms de tests en français ; identifiants de code en anglais.
- Avant de conclure : `npm run build`, `npm run lint`, `npm test`.

Règles détaillées chargées selon le fichier : `.github/instructions/` (tests, UI, domaine).
