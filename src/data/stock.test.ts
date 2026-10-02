import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeDb, getDb } from './db';
import { addStock, consumeStock, loadHousehold } from './stock';
import type { Consumption, StockItem } from '../domain/types';

const item: StockItem = {
  id: 'test',
  name: 'Courgettes',
  quantity: 500,
  unit: 'g',
  barcode: null,
  location: 'frigo',
  dateKind: 'DDM',
  expiresOn: '2026-10-04',
  addedOn: '2026-10-02',
  status: 'en-stock',
};

afterEach(async () => {
  const db = await getDb();
  await db.clear('stock');
  await db.clear('consumptions');
  await closeDb();
  vi.restoreAllMocks();
});

describe('Stock persistant', () => {
  it('conserve le stock et enregistre la consommation avec le solde', async () => {
    await addStock(item);
    await closeDb();
    expect((await loadHousehold()).stock).toEqual([item]);
    await consumeStock(item.id, 200, new Date(2026, 9, 2));
    const state = await loadHousehold();
    expect(state.stock[0]?.quantity).toBe(300);
    expect(state.consumptions[0]?.quantity).toBe(200);
  });

  it('ne modifie pas les données lors d’une consommation invalide', async () => {
    await addStock(item);
    await expect(consumeStock(item.id, 501, new Date(2026, 9, 2))).rejects.toThrow();
    expect((await loadHousehold()).stock[0]?.quantity).toBe(500);
    expect((await loadHousehold()).consumptions).toEqual([]);
  });

  it('annule la mise à jour du stock si l’historique de consommation échoue', async () => {
    await addStock(item);
    const collisionId = '00000000-0000-4000-8000-000000000001';
    const existing: Consumption = {
      id: collisionId,
      stockItemId: item.id,
      quantity: 25,
      unit: 'g',
      consumedOn: '2026-10-02',
      beforeExpiry: true,
    };
    await (await getDb()).add('consumptions', existing);
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(collisionId);

    await expect(consumeStock(item.id, 200, new Date(2026, 9, 2))).rejects.toThrow();

    const state = await loadHousehold();
    expect(state.stock[0]?.quantity).toBe(500);
    expect(state.consumptions).toEqual([existing]);
  });
});
