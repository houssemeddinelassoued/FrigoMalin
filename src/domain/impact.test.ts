import { describe, expect, it } from 'vitest';
import { impactSummary } from './impact';
import type { Consumption, StockItem } from './types';

const today = new Date(2026, 9, 12);
const item: StockItem = {
  id: 'tomato',
  name: 'Tomates',
  barcode: null,
  quantity: 500,
  unit: 'g',
  expiresOn: '2026-10-15',
  dateKind: 'DDM',
  location: 'frigo',
  addedOn: '2026-10-01',
  status: 'en-stock',
};
const entries: Consumption[] = [
  {
    id: 'second',
    stockItemId: item.id,
    quantity: 200,
    unit: 'g',
    consumedOn: '2026-10-10',
    beforeExpiry: true,
  },
  {
    id: 'late',
    stockItemId: item.id,
    quantity: 100,
    unit: 'g',
    consumedOn: '2026-10-11',
    beforeExpiry: false,
  },
  {
    id: 'first',
    stockItemId: item.id,
    quantity: 100,
    unit: 'g',
    consumedOn: '2026-10-01',
    beforeExpiry: true,
  },
  {
    id: 'old',
    stockItemId: item.id,
    quantity: 1,
    unit: 'kg',
    consumedOn: '2026-09-02',
    beforeExpiry: true,
  },
];

describe('Bilan déclaratif', () => {
  it('filtre la période et ne liste pas une consommation tardive comme sauvée', () => {
    const result = impactSummary([item], entries, today, 'month');
    expect(result.weight).toBeCloseTo(0.3);
    expect(result.entries).toHaveLength(3);
    expect(result.recent.map((entry) => entry.id)).toEqual(['second', 'first']);
    expect(result.counts).toEqual([2, 0, 0, 0]);
    expect(result.ratio).toBe(67);
  });
  it('construit la courbe dans l’ordre des dates et respecte les limites de période', () => {
    const result = impactSummary([item], entries, today, 'month');
    expect(result.amounts).toEqual([0.1, 0.1, 0.1, 0.30000000000000004]);
    expect(impactSummary([item], entries, today, 'quarter').weight).toBeCloseTo(1.3);
    expect(impactSummary([item], entries, new Date(2027, 0, 2), 'year').weight).toBe(0);
  });
});
