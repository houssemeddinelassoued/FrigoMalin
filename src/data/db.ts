import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Consumption, IsoDate, StockItem, StockStatus } from '../domain/types';

export const DB_NAME = 'frigomalin';
export const DB_VERSION = 1;

export interface FrigoMalinDB extends DBSchema {
  stock: {
    key: string;
    value: StockItem;
    // Les articles dont barcode vaut null sont absents de l'index barcode.
    indexes: {
      expiresOn: IsoDate;
      status: StockStatus;
      barcode: string;
    };
  };
  consumptions: {
    key: string;
    value: Consumption;
    indexes: {
      stockItemId: string;
    };
  };
}

export type FrigoMalinDatabase = IDBPDatabase<FrigoMalinDB>;

let dbPromise: Promise<FrigoMalinDatabase> | null = null;

export function getDb(): Promise<FrigoMalinDatabase> {
  dbPromise ??= openDB<FrigoMalinDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const stock = db.createObjectStore('stock', { keyPath: 'id' });
        stock.createIndex('expiresOn', 'expiresOn');
        stock.createIndex('status', 'status');
        stock.createIndex('barcode', 'barcode');

        const consumptions = db.createObjectStore('consumptions', { keyPath: 'id' });
        consumptions.createIndex('stockItemId', 'stockItemId');
      }
    },
    blocking() {
      // Une autre ouverture demande une version supérieure : libérer la connexion.
      void dbPromise?.then((db) => db.close());
      dbPromise = null;
    },
  });
  return dbPromise;
}

/** Ferme la connexion courante (utile entre deux tests avec fake-indexeddb). */
export async function closeDb(): Promise<void> {
  if (dbPromise === null) return;
  const db = await dbPromise;
  db.close();
  dbPromise = null;
}
