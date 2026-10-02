# FrigoMalin — cadrage produit du POC

## Problème

En France, le gaspillage alimentaire représente un ordre de grandeur de plusieurs millions de tonnes par an, tous acteurs confondus (ADEME, chiffre exact à vérifier).
À domicile, l’ordre de grandeur souvent cité est d’environ 30 kg jetés par personne et par an, dont une partie encore emballée (ADEME, chiffre et périmètre à vérifier).
Pour un foyer de trois personnes, cela représenterait environ 90 kg par an : extrapolation indicative, à vérifier; toute cette quantité n’est pas nécessairement évitable par l’application.

## Personas

**Camille, parent dans un foyer occupé**
- Objectif : savoir ce qu’il faut consommer et limiter les produits oubliés.
- Frustration : le contenu du frigo change entre les courses et les repas; les dates sont difficiles à suivre.
- Moment d’usage : après les courses, puis au moment de décider du repas.

**Nassim, étudiant au budget serré**
- Objectif : utiliser les aliments déjà achetés avant qu’ils ne soient perdus.
- Frustration : oublie les produits rangés au fond et improvise ses repas avec une visibilité partielle du stock.
- Moment d’usage : avant de faire des courses ou de choisir un repas.

**Élodie, personne seule**
- Objectif : finir les produits entamés et adapter les quantités de recettes à son stock.
- Frustration : les formats achetés dépassent souvent ses besoins; les restes et dates se dispersent dans plusieurs endroits.
- Moment d’usage : en préparant un repas ou en vérifiant les produits à consommer rapidement.

## Proposition de valeur

FrigoMalin aide un foyer à suivre ses aliments sur un appareil partagé, à repérer ceux à consommer en priorité et à estimer les aliments utilisés plutôt que jetés.

## Parcours clés

1. **Ajouter un aliment au stock** : scanner son code-barres via Open Food Facts ou le saisir manuellement si le produit est absent ou le service indisponible; indiquer quantité, emplacement et date si connue.
2. **Repérer les aliments à consommer** : consulter le stock trié par date et identifier les produits proches de leur DLC ou DDM.
3. **Utiliser et comptabiliser un aliment** : trouver une recette adaptée au stock, puis confirmer les aliments et quantités consommés; afficher le total déclaré comme estimation du gaspillage évité.

## Hors périmètre du POC

- Comptes, backend, synchronisation entre appareils et partage à distance.
- Gestion des courses, commandes ou achats auprès de commerçants.
- Reconnaissance automatique des quantités ou suivi automatique des produits consommés.
- Recommandations nutritionnelles ou médicales.
- Mesure vérifiée des déchets réellement évités, des économies financières ou de l’impact carbone.
- Fonctionnement du scan garanti sans connexion à Open Food Facts. La saisie manuelle reste disponible.

## Glossaire

- **DLC** : date limite de consommation. Pour les aliments concernés, ne pas consommer après cette date.
- **DDM** : date de durabilité minimale. Dépassée, elle indique généralement une possible perte de qualité; elle ne signifie pas automatiquement que l’aliment est impropre à la consommation.
- **Stock** : aliments enregistrés dans FrigoMalin, avec leur quantité, leur emplacement et leurs dates lorsqu’elles sont renseignées.
- **Recette** : préparation proposée à partir d’aliments disponibles; les quantités réellement utilisées doivent être confirmées par l’utilisateur.
- **Gaspillage** : aliment destiné à la consommation mais finalement jeté. Dans le POC, le gaspillage évité est une estimation fondée sur les consommations déclarées par l’utilisateur.