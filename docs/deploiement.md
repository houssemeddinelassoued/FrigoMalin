# Publication sur GitHub Pages

## Activation du depot

1. Publier FrigoMalin dans le depot GitHub `FrigoMalin` : le chemin `/FrigoMalin/` doit respecter exactement sa casse.
2. Dans **Settings > Pages > Build and deployment > Source**, choisir **GitHub Actions**.
3. Verifier que GitHub Actions est autorise dans **Settings > Actions > General**, y compris les actions officielles utilisees par le workflow.
4. Verifier les regles de protection de l'environnement `github-pages` : elles doivent autoriser la branche par defaut du depot. Approuver le deploiement si une validation manuelle est configuree.
5. Pousser sur la branche par defaut ou lancer **Tester et publier FrigoMalin** depuis l'onglet **Actions**, en selectionnant cette branche.

L'URL publiee apparait dans l'environnement `github-pages` et dans le resultat du job de publication. Aucun jeton personnel ni secret client n'est necessaire : les actions utilisent `GITHUB_TOKEN` et OIDC.

## Controles avant publication

Le workflow `.github/workflows/pages.yml` s'execute sur les push, les pull requests et les lancements manuels. Avec Node.js 22 et `npm ci`, il execute :

- `npm run lint` ;
- `npm test` ;
- `npm run build` ;
- l'installation de Chromium et `npm run test:e2e` sur le build servi sous `/FrigoMalin/`.

Tout echec bloque la publication. Le rapport Playwright est conserve pendant sept jours lorsqu'il existe. Seuls les push et lancements manuels depuis la branche par defaut peuvent charger l'artefact `dist` puis le publier. Une pull request, meme externe, ne peut pas deployer.

Les actions officielles `configure-pages`, `upload-pages-artifact` et `deploy-pages` gerent la publication. Les permissions globales sont limitees a `contents: read` ; le job de publication dispose uniquement de `pages: write` et `id-token: write`. Le groupe de concurrence `github-pages` garantit une seule publication en cours et ne l'annule pas a l'arrivee d'un nouveau lancement. GitHub peut remplacer un lancement encore en attente par un plus recent : ce n'est pas une file de publications exhaustive.

## Chemin de base et rechargement

Vite definit deja `base: '/FrigoMalin/'`. Conserver ce chemin tant que le site est publie a cette adresse ; `configure-pages` ne modifie pas automatiquement la configuration Vite.

Selon l'ADR 0003, les vues utilisent le hash, par exemple `/FrigoMalin/#/dates` et `/FrigoMalin/#/consommation`. Le fragment n'est pas envoye au serveur : le rechargement redemande `/FrigoMalin/`, sans erreur 404. Les tests e2e verifient l'ouverture et le rechargement de ces deux vues, ainsi que le statut HTTP 200.

Il n'est donc pas necessaire de copier `dist/index.html` vers `dist/404.html`. Les URL sans hash telles que `/FrigoMalin/dates` ne sont pas prises en charge. Un changement vers un routage par chemin necessiterait de revisiter l'ADR et de tester un vrai repli 404.

## Verification apres publication

Ouvrir l'URL de l'environnement `github-pages`, puis ouvrir directement et recharger les vues `#/dates` et `#/consommation`. Verifier que les vues et les assets se chargent sous `/FrigoMalin/`. La premiere execution sur GitHub reste necessaire pour valider les permissions effectives et les parametres Pages du depot : les controles locaux ne les exercent pas.