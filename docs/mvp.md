# Périmètre du POC FrigoMalin

**Horizon :** 5 jours de développement. Application statique déployée sur GitHub Pages, sans backend ni comptes; données conservées dans le navigateur. L’usage hors ligne est attendu après le premier chargement en ligne.

| Fonctionnalité | Moscow | Justification | Critère de succès |
| --- | --- | --- | --- |
| Ajouter, modifier et supprimer manuellement un aliment avec nom, quantité, unité, emplacement et DLC/DDM facultative | Must | La saisie manuelle constitue le socle du suivi et fonctionne sans service externe. | **Test E2E :** créer un aliment et vérifier ses champs dans le stock; modifier sa quantité et vérifier la nouvelle valeur; le supprimer et vérifier qu’il n’apparaît plus. |
| Conserver le stock dans le navigateur | Must | Sans backend ni compte, les données doivent survivre aux rechargements et aux périodes hors ligne. | **Test navigateur :** créer un aliment, recharger la page et vérifier sa présence; couper le réseau, modifier l’aliment, recharger puis vérifier que la modification est conservée. |
| Ouvrir et utiliser la PWA hors ligne sur mobile après chargement initial | Must | L’usage hors ligne mobile est une contrainte; le premier chargement requiert une connexion. GitHub Pages héberge les ressources statiques. | **Test Playwright, viewport 390 × 844 :** charger l’application en ligne et attendre l’activation du service worker; passer hors ligne, recharger et vérifier que les vues Stock, Dates et Consommation s’ouvrent sans erreur réseau. |
| Afficher le stock avec des états de date distincts pour DLC et DDM | Must | Aide à prioriser la consommation sans assimiler une DDM dépassée à une DLC dépassée. | **Test avec date système fixée :** une DLC passée est marquée « dépassée », une DLC à 3 jours ou moins « à consommer bientôt », et une DDM passée « qualité à vérifier ». |
| Déclarer une consommation, mettre à jour la quantité et afficher une estimation du gaspillage évité | Must | Ferme le parcours stock → consommation; le résultat est déclaratif, pas une mesure de déchets réels. | **Test E2E :** pour un aliment de 500 g, déclarer 200 g consommés et vérifier un solde de 300 g; vérifier que 200 g sont ajoutés à l’estimation seulement si la consommation est déclarée avant la date renseignée. |
| Proposer un catalogue limité de recettes statiques, consultable hors ligne et filtrable selon le stock | Should | Le parcours recette est souhaitable, mais secondaire au suivi du stock, des dates et de la consommation dans un POC de cinq jours. | **Test fonctionnel :** au moins 5 recettes embarquées sont consultables hors ligne et le filtre identifie les ingrédients disponibles et manquants. |
| Scanner un code-barres et préremplir les informations disponibles via Open Food Facts | Could | La recherche dépend du réseau et les données produit peuvent être absentes; elle ne doit pas remplacer la saisie manuelle. | **Test fonctionnel en ligne :** un code de test reconnu préremplit les champs disponibles; avec réseau coupé ou code inconnu, la saisie manuelle reste possible. |
| Comptes, backend, synchronisation multi-appareil, courses, recommandations nutritionnelles et mesure vérifiée des déchets, économies ou émissions | Won't | Hors périmètre du POC et incompatible avec le stockage local sans compte ni backend. | Sans objet dans le POC. |

## Risques produit

1. **Perte des données locales :** effacement du stockage du navigateur ou perte de l’appareil; aucune récupération ni synchronisation multi-appareil.
2. **Dépendance réseau du scan :** Open Food Facts peut être inaccessible ou ne pas reconnaître le produit; le parcours manuel doit rester complet et prioritaire.
3. **Indicateur déclaratif :** dates ou consommations mal saisies et déclarations incomplètes rendent l’estimation imprécise; elle ne démontre pas une réduction effective du gaspillage.
