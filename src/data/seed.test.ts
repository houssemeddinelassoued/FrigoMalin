import { describe, expect, it } from 'vitest';
import { generateSeedStock, toIsoDate } from './seed.ts';

describe('generateSeedStock', () => {
  const today = new Date(2026, 9, 2);
  const todayIso = toIsoDate(today);
  const in30Days = toIsoDate(new Date(2026, 9, 32));
  const items = generateSeedStock(today, () => crypto.randomUUID());

  it('génère 40 articles en stock', () => {
    expect(items).toHaveLength(40);
    expect(items.every((item) => item.status === 'en-stock')).toBe(true);
  });

  it('respecte la répartition des dates', () => {
    const expiredDlc = items.filter(
      (i) => i.dateKind === 'DLC' && i.expiresOn !== null && i.expiresOn < todayIso,
    );
    const expiredDdm = items.filter(
      (i) => i.dateKind === 'DDM' && i.expiresOn !== null && i.expiresOn < todayIso,
    );
    const expiringToday = items.filter((i) => i.expiresOn === todayIso);
    const upcoming = items.filter(
      (i) => i.expiresOn !== null && i.expiresOn > todayIso && i.expiresOn <= in30Days,
    );

    expect(expiredDlc).toHaveLength(3);
    expect(expiredDdm).toHaveLength(2);
    expect(expiringToday).toHaveLength(3);
    expect(upcoming).toHaveLength(32);
  });

  it('ajoute chaque article avant sa date et au plus tard aujourd’hui', () => {
    for (const item of items) {
      expect(item.addedOn <= todayIso).toBe(true);
      expect(item.expiresOn).not.toBeNull();
      if (item.expiresOn !== null) expect(item.addedOn < item.expiresOn).toBe(true);
    }
  });
});
