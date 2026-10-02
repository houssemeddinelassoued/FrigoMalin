---
name: openfoodfacts-api
description: "Référence de l'API publique Open Food Facts pour FrigoMalin (fiche produit par code-barres). Utiliser pour tout code qui recherche un produit par code-barres ou affiche des informations produit."
---

# Open Food Facts

## Contrat API

```text
GET https://world.openfoodfacts.org/api/v2/product/{code}.json?fields=product_name,brands,quantity,image_front_small_url
```

Le code-barres reste une chaîne pour préserver les zéros initiaux. Valider le
format avant tout appel réseau selon les règles du domaine.

| Réponse | Comportement |
| --- | --- |
| `status = 1`, produit valide | Préremplir les informations disponibles, puis laisser l'utilisateur les corriger. |
| `status = 0` | Produit inconnu : proposer la saisie manuelle. |
| Hors ligne, délai dépassé, erreur réseau ou HTTP, JSON invalide | Repli hors ligne : utiliser la fiche en cache pour ce code-barres si disponible ; sinon permettre la saisie manuelle sans bloquer l'ajout. |

Seuls `product_name`, `brands`, `quantity` et `image_front_small_url` sont
demandés. Les champs peuvent être absents : ne pas inventer leurs valeurs.
La quantité est un libellé produit, pas une quantité de stock. L'image est
facultative ; son absence ou son échec de chargement ne doit pas bloquer l'ajout.
Ces données ne fournissent ni DLC ni DDM : ces dates restent saisies par l'utilisateur.

## Procédure

1. Lire l'adaptateur existant et ses tests avant de changer la recherche ou
   l'affichage d'un produit. Respecter les instructions locales du domaine et des tests.
2. Centraliser les appels dans `src/data/off.ts`, jamais dans les composants.
   Si l'accès se trouve encore dans `src/data/foodFacts.ts`, faire une migration
   ciblée de l'adaptateur et de ses imports lors d'une tâche d'implémentation.
   Ne pas créer un second accès réseau concurrent. Ce skill seul ne réalise pas cette migration.
3. Utiliser `AbortController` et programmer `abort()` après **4 000 ms**.
   Transmettre son `signal` à `fetch`. Le délai couvre la requête et la lecture
   de la réponse ; libérer le timer dans `finally`, sur succès comme sur erreur.
4. Vérifier le statut HTTP puis décoder le JSON comme `unknown`, sans `any`.
   Vérifier `status`, la présence d'un objet `product` et les types des champs
   utilisés avant de les exposer à l'interface. Une réponse inexploitable suit le repli manuel.
5. Garder le stock local et la saisie manuelle utilisables sans réseau.
   Mémoriser uniquement les fiches validées après `status = 1`, par code-barres,
   avec une date de récupération. Utiliser IndexedDB via la couche de données
   existante ; si un store est nécessaire, suivre les règles de migration du dépôt.
   En cas d'indisponibilité, proposer la fiche mémorisée pour ce code et signaler
   son origine, tout en permettant la correction manuelle. Sans cache, conserver
   le code-barres et proposer la saisie manuelle. Un `status = 0` reçu de l'API
   reste un produit inconnu et ne doit pas être masqué par une ancienne fiche.
   Une panne ne signifie pas produit inconnu ; une erreur de cache ne bloque
   jamais la saisie. La création du skill n'implémente pas ce cache.
6. Tester avec les exemples ci-dessous via un `fetch` simulé, sans appeler
   l'API publique. Couvrir le succès, le produit inconnu, les champs absents,
   les erreurs réseau/HTTP et le JSON invalide, ainsi que le repli avec cache,
   sans cache et avec cache défaillant. Vérifier qu'un code ne reçoit jamais la
   fiche d'un autre code et que `status = 0` n'est pas remplacé par le cache.
   Avec des timers simulés,
   vérifier l'annulation à 4 s et le nettoyage du timer.

## Exemples

Réponses synthétiques, réduites aux champs utiles ; elles ne décrivent pas un
produit réel et l'URL d'image n'est pas une ressource à charger pendant les tests.

- [Produit trouvé](./exemples/produit-trouve.json) : enveloppe `status = 1` et quatre champs produit.
- [Produit inconnu](./exemples/produit-inconnu.json) : enveloppe `status = 0`, sans objet produit.

## Vérification

Vérifier l'URL exacte et ses champs, l'absence d'appel pour un code invalide,
le signal d'annulation et la disponibilité de la saisie manuelle après un échec.
Exécuter les tests ciblés de l'adaptateur puis les contrôles requis du dépôt :
`npm run build`, `npm run lint`, `npm test`.