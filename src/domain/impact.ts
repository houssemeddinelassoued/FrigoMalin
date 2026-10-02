import { localDate, remainingDays, savedWeight } from './stock';
import type { Consumption, StockItem } from './types';

export type ImpactPeriod = 'month' | 'quarter' | 'year';

export function impactSummary(
  stock: readonly StockItem[],
  consumptions: readonly Consumption[],
  today: Date,
  period: ImpactPeriod,
) {
  const startDate = new Date(
    today.getFullYear(),
    period === 'year' ? 0 : today.getMonth() - (period === 'quarter' ? 2 : 0),
    1,
  );
  const start = localDate(startDate);
  const end = localDate(today);
  const entries = consumptions
    .filter((entry) => entry.consumedOn >= start && entry.consumedOn <= end)
    .sort((first, second) => first.consumedOn.localeCompare(second.consumedOn));
  const saved = entries.filter((entry) => entry.beforeExpiry);
  const groups = [
    /tomate|courgette|carotte|salade|pomme|banane|poireau|champignon/i,
    /yaourt|lait|crème|fromage|comté|beurre|mozzarella/i,
    /saumon|poulet|jambon|steak|cabillaud|lardon/i,
    /.*/,
  ];
  const counts = groups.map(
    (group, index) =>
      saved.filter((entry) => {
        const name = stock.find((item) => item.id === entry.stockItemId)?.name ?? '';
        return group.test(name) && !groups.slice(0, index).some((previous) => previous.test(name));
      }).length,
  );
  const days = remainingDays(end, startDate);
  const amounts = Array.from({ length: 4 }, (_, index) =>
    savedWeight(
      saved.filter(
        (entry) => remainingDays(entry.consumedOn, startDate) <= Math.floor((days * index) / 3),
      ),
    ),
  );
  return {
    entries,
    saved,
    counts,
    amounts,
    weight: savedWeight(saved),
    ratio: entries.length ? Math.round((saved.length / entries.length) * 100) : 0,
    recent: [...saved].reverse().slice(0, 4),
  };
}
