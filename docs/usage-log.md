# Carnet de consommation de l'assistant IA

Suivi de l'usage de GitHub Copilot sur le POC FrigoMalin, pour repérer ce qui consomme du contexte ou des requêtes et ajuster les instructions.

## Comment remplir

- Une ligne par demande significative.
- **Instructions chargées** : fichiers de `.github/instructions/` effectivement attachés (visibles dans les références de la réponse).
- **Requêtes** : nombre de requêtes premium décomptées, si connu.
- **Résultat** : ✅ accepté tel quel, ✏️ corrigé à la main, ❌ rejeté.

## Journal

| Date | Tâche | Modèle | Requêtes | Instructions chargées | Vérification | Résultat | Remarques |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-02 | Types du domaine, base IndexedDB, jeu de données de 40 produits | Claude Opus 5.5 | à compléter | `copilot-instructions.md` | `tsc` strict | ✅ | `expiresOn` obligatoire alors que la date est facultative dans le MVP : à trancher. |
| 2026-10-02 | Script `build` et `tsconfig` | Claude Opus 5.5 | à compléter | `copilot-instructions.md` | `npm run build` | ✅ | |
| 2026-10-02 | `.copilotignore` | Claude Opus 5.5 | à compléter | `copilot-instructions.md` | aucune | ✅ | Fichier non lu par Copilot ; l'exclusion de contenu se configure sur GitHub. |
| 2026-10-02 | Projet Vite + Preact, ESLint, Prettier, Vitest, Playwright | Claude Opus 5.5 | à compléter | `copilot-instructions.md` | build, lint, test | ✏️ | jsdom 30 incompatible avec Node 24.12 ; CRLF signalé par Prettier. E2E non exécuté. |
| 2026-10-02 | Découpage des instructions par type de fichier, création du carnet | Claude Opus 5.5 | à compléter | `copilot-instructions.md` | relecture | ✅ | |

## Enseignements

- Les règles spécifiques (tests, UI, domaine) sont chargées via `applyTo` ; `copilot-instructions.md` ne garde que l'essentiel commun.
- Donner un critère de succès vérifiable (« `npm run build` sans erreur ») évite les allers-retours.
