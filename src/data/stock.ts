import { getDb } from './db';
import { consumeItem, localDate } from '../domain/stock';
import type { Consumption, StockItem, StorageLocation } from '../domain/types';

export interface HouseholdState {
  stock: StockItem[];
  consumptions: Consumption[];
}

export async function loadHousehold(): Promise<HouseholdState> {
  const db = await getDb();
  const transaction = db.transaction(['stock', 'consumptions'], 'readonly');
  const [stock, consumptions] = await Promise.all([
    transaction.objectStore('stock').getAll(),
    transaction.objectStore('consumptions').getAll(),
  ]);
  await transaction.done;
  return { stock, consumptions };
}

export async function addStock(item: StockItem): Promise<void> {
  const db = await getDb();
  await db.add('stock', item);
}

export async function consumeStock(id: string, quantity: number, today: Date): Promise<void> {
  const db = await getDb();
  const transaction = db.transaction(['stock', 'consumptions'], 'readwrite');
  const done = transaction.done;
  void done.catch(() => undefined);
  try {
    const item = await transaction.objectStore('stock').get(id);
    if (!item) throw new Error('Cet aliment n’est plus disponible.');
    const result = consumeItem(item, quantity, today, crypto.randomUUID());
    await transaction.objectStore('stock').put(result.item);
    await transaction.objectStore('consumptions').add(result.consumption);
    await done;
  } catch (error) {
    transaction.abort();
    await done.catch(() => undefined);
    throw error;
  }
}

export async function moveStock(id: string, location: StorageLocation, today: Date): Promise<void> {
  const db = await getDb();
  const transaction = db.transaction('stock', 'readwrite');
  const item = await transaction.store.get(id);
  if (item) {
    if (item.dateKind === 'DLC' && item.expiresOn !== null && item.expiresOn < localDate(today)) {
      await transaction.done;
      throw new Error('Une DLC dépassée ne doit pas être prolongée par congélation.');
    }
    await transaction.store.put({ ...item, location });
  }
  await transaction.done;
}

export async function discardStock(id: string): Promise<void> {
  const db = await getDb();
  const transaction = db.transaction('stock', 'readwrite');
  const item = await transaction.store.get(id);
  if (item) await transaction.store.put({ ...item, status: 'jeté' });
  await transaction.done;
}

export async function loadDemo(today: Date): Promise<void> {
  const { generateSeedStock } = await import('./seed');
  const db = await getDb();
  const transaction = db.transaction('stock', 'readwrite');
  if ((await transaction.store.count()) === 0) {
    for (const item of generateSeedStock(today)) await transaction.store.add(item);
  }
  await transaction.done;
}
