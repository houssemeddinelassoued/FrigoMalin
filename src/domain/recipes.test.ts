import { describe, expect, it } from 'vitest';
import { recipeMatches, recipes } from './recipes';
import type { StockItem } from './types';

describe('Recettes anti-gaspi', () => {
  it('ne confond pas le riz et le chorizo', () => {
    const item: StockItem = {
      id: 'chorizo',
      name: 'Chorizo',
      barcode: null,
      quantity: 200,
      unit: 'g',
      expiresOn: '2026-10-05',
      dateKind: 'DLC',
      location: 'frigo',
      addedOn: '2026-10-01',
      status: 'en-stock',
    };
    const bowl = recipes.find((recipe) => recipe.id === 'bowl');
    if (!bowl) throw new Error('Recette manquante');
    expect(
      recipeMatches(bowl, [item], new Date(2026, 9, 2)).find(
        (ingredient) => ingredient.name === 'Riz',
      )?.available,
    ).toBe(false);
  });
  it('embarque cinq recettes avec ingrédients et étapes', () => {
    expect(recipes.length).toBeGreaterThanOrEqual(5);
    for (const recipe of recipes) {
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
    }
  });
  it('ne propose jamais une DLC dépassée comme ingrédient disponible', () => {
    const item: StockItem = {
      id: 'salmon',
      name: 'Saumon fumé',
      barcode: null,
      quantity: 120,
      unit: 'g',
      expiresOn: '2026-10-01',
      dateKind: 'DLC',
      location: 'frigo',
      addedOn: '2026-09-29',
      status: 'en-stock',
    };
    const recipe = recipes[0];
    if (!recipe) throw new Error('Catalogue vide');
    expect(
      recipeMatches(recipe, [item], new Date(2026, 9, 2)).some((entry) => entry.available),
    ).toBe(false);
    expect(
      recipeMatches(recipe, [{ ...item, expiresOn: '2026-10-03' }], new Date(2026, 9, 2)).some(
        (entry) => entry.available,
      ),
    ).toBe(true);
  });

  it('associe un ingrédient par inclusion sans tenir compte de la casse', () => {
    const item: StockItem = {
      id: 'cream',
      name: 'CRÈME entière',
      barcode: null,
      quantity: 200,
      unit: 'ml',
      expiresOn: null,
      dateKind: 'DLC',
      location: 'frigo',
      addedOn: '2026-09-29',
      status: 'en-stock',
    };
    const recipe = recipes[0];
    if (!recipe) throw new Error('Catalogue vide');

    const matches = recipeMatches(recipe, [item], new Date(2026, 9, 2));

    expect(matches.map((entry) => entry.available)).toEqual([true, false, false, false]);
  });

  it('marque tous les ingrédients indisponibles si le stock est vide', () => {
    const recipe = recipes[0];
    if (!recipe) throw new Error('Catalogue vide');

    expect(recipeMatches(recipe, [], new Date(2026, 9, 2)).every((entry) => !entry.available)).toBe(
      true,
    );
  });

  it('ignore les articles consommés, jetés ou sans quantité positive', () => {
    const item: StockItem = {
      id: 'salmon',
      name: 'Saumon fumé',
      barcode: null,
      quantity: 120,
      unit: 'g',
      expiresOn: null,
      dateKind: 'DLC',
      location: 'frigo',
      addedOn: '2026-09-29',
      status: 'en-stock',
    };
    const recipe = recipes[0];
    if (!recipe) throw new Error('Catalogue vide');
    const unavailableItems: StockItem[] = [
      { ...item, status: 'consommé' },
      { ...item, status: 'jeté' },
      { ...item, quantity: 0 },
      { ...item, quantity: -1 },
    ];

    for (const unavailableItem of unavailableItems) {
      const salmon = recipeMatches(recipe, [unavailableItem], new Date(2026, 9, 2)).find(
        (entry) => entry.name === 'Saumon',
      );
      expect(salmon?.available).toBe(false);
    }
  });

  it('n’exclut que les DLC déjà dépassées, y compris aux bornes de date', () => {
    const item: StockItem = {
      id: 'salmon',
      name: 'Saumon fumé',
      barcode: null,
      quantity: 120,
      unit: 'g',
      expiresOn: '2026-10-02',
      dateKind: 'DLC',
      location: 'frigo',
      addedOn: '2026-09-29',
      status: 'en-stock',
    };
    const recipe = recipes[0];
    if (!recipe) throw new Error('Catalogue vide');

    for (const expiresOn of ['2026-10-02', '2026-10-05', '2026-10-06']) {
      const salmon = recipeMatches(recipe, [{ ...item, expiresOn }], new Date(2026, 9, 2)).find(
        (entry) => entry.name === 'Saumon',
      );
      expect(salmon?.available).toBe(true);
    }
  });

  it('considère une DDM dépassée comme disponible et accepte une date inconnue', () => {
    const item: StockItem = {
      id: 'salmon',
      name: 'Saumon fumé',
      barcode: null,
      quantity: 120,
      unit: 'g',
      expiresOn: '2026-10-01',
      dateKind: 'DDM',
      location: 'frigo',
      addedOn: '2026-09-29',
      status: 'en-stock',
    };
    const recipe = recipes[0];
    if (!recipe) throw new Error('Catalogue vide');

    for (const expiresOn of ['2026-10-01', null]) {
      const salmon = recipeMatches(recipe, [{ ...item, expiresOn }], new Date(2026, 9, 2)).find(
        (entry) => entry.name === 'Saumon',
      );
      expect(salmon?.available).toBe(true);
    }
  });
});
