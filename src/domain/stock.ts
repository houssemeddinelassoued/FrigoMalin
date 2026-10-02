import type { Consumption, ExpiryState, IsoDate, StockItem } from './types';

function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isValidStockItem(value: unknown): value is StockItem {
  if (!isRecord(value)) return false;
  const candidate = value;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    (typeof candidate.barcode === 'string' || candidate.barcode === null) &&
    typeof candidate.quantity === 'number' &&
    Number.isFinite(candidate.quantity) &&
    candidate.quantity > 0 &&
    ['pièce', 'g', 'kg', 'ml', 'L'].includes(String(candidate.unit)) &&
    (candidate.expiresOn === null || isIsoDate(candidate.expiresOn)) &&
    (candidate.dateKind === 'DLC' || candidate.dateKind === 'DDM') &&
    (candidate.location === 'frigo' ||
      candidate.location === 'congélateur' ||
      candidate.location === 'placard') &&
    isIsoDate(candidate.addedOn) &&
    (candidate.status === 'en-stock' ||
      candidate.status === 'consommé' ||
      candidate.status === 'jeté')
  );
}

export function localDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function remainingDays(date: IsoDate, today: Date): number {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return Math.round(
    (Date.UTC(year, month - 1, day) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
}

export function expiryState(item: StockItem, today: Date): ExpiryState | null {
  if (item.expiresOn === null) return null;
  const days = remainingDays(item.expiresOn, today);
  if (days < 0) return item.dateKind === 'DLC' ? 'dépassée' : 'qualité à vérifier';
  return days <= 3 ? 'à consommer bientôt' : 'ok';
}

export function consumeItem(
  item: StockItem,
  quantity: number,
  today: Date,
  id: string,
): { item: StockItem; consumption: Consumption } {
  if (
    item.status !== 'en-stock' ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity > item.quantity
  ) {
    throw new Error('La quantité doit être positive et ne pas dépasser le stock disponible.');
  }
  if (
    item.dateKind === 'DLC' &&
    item.expiresOn !== null &&
    remainingDays(item.expiresOn, today) < 0
  ) {
    throw new Error('DLC dépassée : ne consommez pas cet aliment.');
  }
  const remaining = item.quantity - quantity;
  return {
    item: { ...item, quantity: remaining, status: remaining === 0 ? 'consommé' : 'en-stock' },
    consumption: {
      id,
      stockItemId: item.id,
      quantity,
      unit: item.unit,
      consumedOn: localDate(today),
      beforeExpiry: item.expiresOn !== null && localDate(today) <= item.expiresOn,
    },
  };
}

export function savedWeight(consumptions: readonly Consumption[]): number {
  return consumptions.reduce(
    (total, entry) =>
      total +
      (entry.beforeExpiry
        ? entry.unit === 'kg'
          ? entry.quantity
          : entry.unit === 'g'
            ? entry.quantity / 1000
            : 0
        : 0),
    0,
  );
}

export const formatNumber = (value: number, digits = 1): string =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value);

export function dateLabel(item: StockItem, today: Date): string | null {
  if (item.expiresOn === null) return null;
  const days = remainingDays(item.expiresOn, today);
  if (days < 0) return item.dateKind === 'DLC' ? 'DLC dépassée' : 'DDM : qualité à vérifier';
  return days === 0 ? 'Aujourd’hui' : days === 1 ? 'Demain' : `${item.dateKind} J+${days}`;
}
