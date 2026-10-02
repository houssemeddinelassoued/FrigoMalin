import { describe, expect, it } from 'vitest';
import { consumeItem, expiryState, isValidStockItem, remainingDays, savedWeight } from './stock';
import type { StockItem } from './types';

const today = new Date(2026, 9, 2);
const item: StockItem = {
  id: 'cream',
  name: 'Crème fraîche',
  barcode: null,
  quantity: 500,
  unit: 'g',
  expiresOn: '2026-10-02',
  dateKind: 'DLC',
  location: 'frigo',
  addedOn: '2026-10-01',
  status: 'en-stock',
};

describe('Dates et consommation du stock', () => {
  it('validation inventaire : rejette les champs invalides', () => {
    expect(isValidStockItem({ ...item, expiresOn: null })).toBe(true);
    const invalidItems: unknown[] = [
      { ...item, name: '' },
      { ...item, name: '   ' },
      { ...item, quantity: 0 },
      { ...item, quantity: -1 },
      { ...item, quantity: Number.NaN },
      { ...item, quantity: Number.POSITIVE_INFINITY },
      { ...item, expiresOn: '2026-02-30' },
    ];

    for (const invalidItem of invalidItems) {
      expect(isValidStockItem(invalidItem)).toBe(false);
    }
  });

  it('dates inventaire : distingue les frontières DLC/DDM et l’absence de date', () => {
    expect(expiryState({ ...item, expiresOn: '2026-10-01' }, today)).toBe('dépassée');
    expect(expiryState({ ...item, dateKind: 'DDM', expiresOn: '2026-10-01' }, today)).toBe(
      'qualité à vérifier',
    );
    expect(expiryState(item, today)).toBe('à consommer bientôt');
    expect(expiryState({ ...item, expiresOn: '2026-10-05' }, today)).toBe('à consommer bientôt');
    expect(expiryState({ ...item, expiresOn: '2026-10-06' }, today)).toBe('ok');
    expect(remainingDays('2026-10-05', today)).toBe(3);
    expect(expiryState({ ...item, expiresOn: null }, today)).toBeNull();
  });

  it('déclare une consommation partielle sans dépasser le stock', () => {
    const result = consumeItem(item, 200, today, 'consumption');
    expect(result.item.quantity).toBe(300);
    expect(result.item.status).toBe('en-stock');
    expect(result.consumption.beforeExpiry).toBe(true);
    expect(savedWeight([result.consumption])).toBe(0.2);
    expect(() => consumeItem(item, 501, today, 'invalid')).toThrow();
    expect(() => consumeItem(item, 0, today, 'invalid')).toThrow();
  });

  it('termine un aliment et ne compte pas les consommations tardives', () => {
    const result = consumeItem({ ...item, dateKind: 'DDM' }, 500, new Date(2026, 9, 3), 'late');
    expect(result.item.status).toBe('consommé');
    expect(savedWeight([result.consumption])).toBe(0);
    expect(() => consumeItem(item, 500, new Date(2026, 9, 3), 'expired')).toThrow('DLC dépassée');
    expect(() => consumeItem({ ...item, status: 'consommé' }, 1, today, 'invalid')).toThrow();
  });
});
