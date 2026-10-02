---
description: "Règles pour écrire et maintenir les tests FrigoMalin : Vitest, Testing Library, Playwright, fake-indexeddb, dates figées."
applyTo: "**/*.test.ts, **/*.test.tsx, e2e/**/*.ts, src/test/**, vite.config.ts, playwright.config.ts"
---

# Tests

## Outils et emplacement

- Tests unitaires et de composants : Vitest + jsdom, fichiers `*.test.ts(x)` à côté du code testé dans `src/`.
- Tests de bout en bout : Playwright dans `e2e/*.spec.ts`, exécutés sur le build servi par `vite preview`.
- Commandes : `npm test`, `npm run test:e2e`, puis `npm run lint` avant de conclure.

## Règles

- Importer explicitement `describe`, `it`, `expect`, `vi` depuis `vitest` (pas de globals).
- Noms de tests en français décrivant le comportement attendu, pas l'implémentation.
- Ne jamais dépendre de la date réelle : passer `today` en paramètre ou utiliser `vi.useFakeTimers()` / `vi.setSystemTime()`. Construire les dates en heure locale (`new Date(2026, 9, 2)`), jamais via une chaîne ISO interprétée en UTC.
- Couvrir les cas limites DLC/DDM : date passée, aujourd'hui, J+3, DDM dépassée (« qualité à vérifier », pas « dépassée »).
- IndexedDB : utiliser `fake-indexeddb` (à ajouter en devDependency au premier besoin) et appeler `closeDb()` entre les tests.
- Aucun appel réseau réel vers Open Food Facts : simuler `fetch` et tester aussi l'échec réseau et le produit inconnu.
- Pas de `any`, pas de `as` pour forcer un type dans les fixtures : construire des objets typés complets.

## Testing Library

- Requêtes par rôle et nom accessible d'abord (`getByRole`, `getByLabelText`), `getByTestId` en dernier recours.
- Vérifier ce que voit l'utilisateur (texte, état, focus), pas l'état interne des composants.
- Les matchers `jest-dom` sont chargés par `src/test/setup.ts`.

## Playwright

- Viewport mobile 390 × 844 (projet `mobile-chromium`).
- Naviguer en relatif à `baseURL` (`page.goto('./#/stock')`) pour respecter `/FrigoMalin/` et le routage hash (ADR 0003).
- Tests hors ligne : `context.setOffline(true)` après activation du service worker.
- Préférer les assertions web-first (`await expect(locator).toBeVisible()`) aux attentes fixes.
