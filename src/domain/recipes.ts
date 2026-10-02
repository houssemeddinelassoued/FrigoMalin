import { expiryState } from './stock';
import type { Recipe, StockItem } from './types';

export interface RecipeDetails extends Recipe {
  image: string;
  tag: string;
  servings: number;
  steps: string[];
}

export const recipes: readonly RecipeDetails[] = [
  {
    id: 'tart',
    title: 'Tarte rustique courgettes, crème & saumon',
    image: 'recipes-2',
    tag: 'Top sauvetage',
    minutes: 55,
    servings: 4,
    ingredients: [
      { name: 'Crème', quantity: 200, unit: 'ml' },
      { name: 'Saumon', quantity: 280, unit: 'g' },
      { name: 'Courgettes', quantity: 2, unit: 'pièce' },
      { name: 'Pâte', quantity: 1, unit: 'pièce' },
    ],
    steps: [
      'Préchauffer le four à 180 °C. Laver les courgettes et les couper en fines rondelles.',
      'Étaler la pâte dans un moule. Répartir les courgettes et le saumon coupé en morceaux.',
      'Ajouter la crème, un peu de poivre et des herbes. Replier les bords de la pâte.',
      'Cuire 30 minutes, jusqu’à cuisson complète du saumon et coloration de la pâte. Servir chaud.',
    ],
  },
  {
    id: 'gratin',
    title: 'Gratin malin & restes de fromage',
    image: 'recipes-3',
    tag: 'Tout au four',
    minutes: 35,
    servings: 4,
    ingredients: [
      { name: 'Courgettes', quantity: 2, unit: 'pièce' },
      { name: 'Comté', quantity: 100, unit: 'g' },
      { name: 'Crème', quantity: 100, unit: 'ml' },
    ],
    steps: [
      'Préchauffer le four à 190 °C. Couper les courgettes et les cuire 5 minutes dans une poêle.',
      'Mettre dans un plat avec la crème. Recouvrir de comté râpé.',
      'Enfourner environ 25 minutes jusqu’à obtenir un gratin bien doré.',
    ],
  },
  {
    id: 'bowl',
    title: 'Bowl express saumon tiède & riz',
    image: 'recipes-4',
    tag: 'Ultra-rapide',
    minutes: 15,
    servings: 2,
    ingredients: [
      { name: 'Saumon', quantity: 120, unit: 'g' },
      { name: 'Riz', quantity: 150, unit: 'g' },
      { name: 'Carottes', quantity: 100, unit: 'g' },
    ],
    steps: [
      'Cuire le riz selon les indications du paquet. Râper les carottes.',
      'Cuire complètement le saumon à la poêle puis l’émietter.',
      'Répartir le riz, les carottes et le saumon dans deux bols. Assaisonner et servir immédiatement.',
    ],
  },
  {
    id: 'pancakes',
    title: 'Pancakes aux yaourts & fruits mûrs',
    image: 'recipes-5',
    tag: 'Dessert zéro déchet',
    minutes: 20,
    servings: 4,
    ingredients: [
      { name: 'Yaourts', quantity: 2, unit: 'pièce' },
      { name: 'Bananes', quantity: 2, unit: 'pièce' },
      { name: 'Œufs', quantity: 2, unit: 'pièce' },
      { name: 'Farine', quantity: 150, unit: 'g' },
    ],
    steps: [
      'Mélanger les yaourts, les œufs et la farine jusqu’à obtenir une pâte homogène.',
      'Faire cuire de petites louches de pâte dans une poêle légèrement huilée, 2 minutes de chaque côté.',
      'Servir avec les bananes coupées en rondelles.',
    ],
  },
  {
    id: 'vegetables',
    title: 'Poêlée de légumes & pois chiches',
    image: 'recipes-3',
    tag: 'Batch cooking',
    minutes: 25,
    servings: 4,
    ingredients: [
      { name: 'Courgettes', quantity: 2, unit: 'pièce' },
      { name: 'Tomates', quantity: 300, unit: 'g' },
      { name: 'Pois chiches', quantity: 400, unit: 'g' },
    ],
    steps: [
      'Laver et couper les légumes. Égoutter les pois chiches.',
      'Faire revenir les légumes dans un peu d’huile pendant 15 minutes.',
      'Ajouter les pois chiches et les herbes, puis cuire 5 minutes de plus.',
    ],
  },
];

export function recipeMatches(recipe: Recipe, stock: readonly StockItem[], today: Date) {
  return recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    available: stock.some(
      (item) =>
        item.status === 'en-stock' &&
        item.quantity > 0 &&
        expiryState(item, today) !== 'dépassée' &&
        item.name.toLocaleLowerCase('fr').includes(ingredient.name.toLocaleLowerCase('fr')),
    ),
  }));
}
