import type { DateKind, IsoDate, StockItem, StorageLocation, Unit } from '../domain/types';

interface ProductTemplate {
  name: string;
  quantity: number;
  unit: Unit;
  location: StorageLocation;
  dateKind: DateKind;
  hasBarcode: boolean;
}

const p = (
  name: string,
  quantity: number,
  unit: Unit,
  location: StorageLocation,
  dateKind: DateKind,
  hasBarcode = true,
): ProductTemplate => ({ name, quantity, unit, location, dateKind, hasBarcode });

const EXPIRED_DLC: readonly ProductTemplate[] = [
  p('Yaourts nature', 4, 'pièce', 'frigo', 'DLC'),
  p('Blancs de poulet', 400, 'g', 'frigo', 'DLC'),
  p('Crème fraîche liquide', 200, 'ml', 'frigo', 'DLC'),
];

const EXPIRING_TODAY: readonly ProductTemplate[] = [
  p('Jambon blanc', 4, 'pièce', 'frigo', 'DLC'),
  p('Lait frais demi-écrémé', 1, 'L', 'frigo', 'DLC'),
  p('Salade en sachet', 150, 'g', 'frigo', 'DLC'),
];

const EXPIRED_DDM: readonly ProductTemplate[] = [
  p('Biscuits sablés', 200, 'g', 'placard', 'DDM'),
  p('Riz basmati', 1, 'kg', 'placard', 'DDM'),
];

// Ordonnés du plus périssable au moins périssable : l'échéance croît avec l'index.
const UPCOMING: readonly ProductTemplate[] = [
  p('Steaks hachés', 2, 'pièce', 'frigo', 'DLC'),
  p('Saumon fumé', 120, 'g', 'frigo', 'DLC'),
  p('Champignons de Paris', 250, 'g', 'frigo', 'DDM', false),
  p('Mozzarella', 125, 'g', 'frigo', 'DLC'),
  p('Lardons fumés', 200, 'g', 'frigo', 'DLC'),
  p('Tomates', 500, 'g', 'frigo', 'DDM', false),
  p('Bananes', 5, 'pièce', 'placard', 'DDM', false),
  p('Fromage blanc', 500, 'g', 'frigo', 'DLC'),
  p('Jus d’orange frais', 1, 'L', 'frigo', 'DLC'),
  p('Pâte feuilletée', 230, 'g', 'frigo', 'DLC'),
  p('Crèmes dessert chocolat', 4, 'pièce', 'frigo', 'DLC'),
  p('Courgettes', 3, 'pièce', 'frigo', 'DDM', false),
  p('Houmous', 200, 'g', 'frigo', 'DLC'),
  p('Emmental râpé', 200, 'g', 'frigo', 'DLC'),
  p('Poireaux', 2, 'pièce', 'frigo', 'DDM', false),
  p('Comté', 250, 'g', 'frigo', 'DLC'),
  p('Pain de mie', 500, 'g', 'placard', 'DDM'),
  p('Œufs', 6, 'pièce', 'frigo', 'DDM'),
  p('Pommes', 6, 'pièce', 'placard', 'DDM', false),
  p('Carottes', 1, 'kg', 'frigo', 'DDM', false),
  p('Beurre doux', 250, 'g', 'frigo', 'DDM'),
  p('Brioche tranchée', 500, 'g', 'placard', 'DDM'),
  p('Compote de pommes', 4, 'pièce', 'placard', 'DDM'),
  p('Céréales muesli', 375, 'g', 'placard', 'DDM'),
  p('Lait UHT demi-écrémé', 1, 'L', 'placard', 'DDM'),
  p('Tomates concassées', 400, 'g', 'placard', 'DDM'),
  p('Pois chiches en conserve', 400, 'g', 'placard', 'DDM'),
  p('Pâtes penne', 500, 'g', 'placard', 'DDM'),
  p('Pizza surgelée', 1, 'pièce', 'congélateur', 'DDM'),
  p('Petits pois surgelés', 1, 'kg', 'congélateur', 'DDM'),
  p('Épinards hachés surgelés', 600, 'g', 'congélateur', 'DDM'),
  p('Filets de cabillaud surgelés', 400, 'g', 'congélateur', 'DDM'),
];

const UPCOMING_WINDOW_DAYS = 30;

export function toIsoDate(date: Date): IsoDate {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

/** EAN-13 fictif à préfixe 200 (usage interne), donc sans collision avec un vrai produit. */
function fakeEan13(index: number): string {
  const body = `200${String(index).padStart(9, '0')}`;
  const sum = [...body].reduce((acc, ch, i) => acc + Number(ch) * (i % 2 === 0 ? 1 : 3), 0);
  return `${body}${(10 - (sum % 10)) % 10}`;
}

/**
 * Génère 40 articles en stock, dates relatives à `today` :
 * 3 DLC dépassées, 3 échéances aujourd'hui, 2 DDM dépassées, 32 réparties sur J+1 à J+30.
 */
export function generateSeedStock(
  today: Date = new Date(),
  createId: () => string = () => crypto.randomUUID(),
): StockItem[] {
  const planned: { template: ProductTemplate; offset: number }[] = [
    ...EXPIRED_DLC.map((template, i) => ({ template, offset: -(i + 1) })),
    ...EXPIRING_TODAY.map((template) => ({ template, offset: 0 })),
    ...EXPIRED_DDM.map((template, i) => ({ template, offset: -(10 + i * 20) })),
    ...UPCOMING.map((template, i) => ({
      template,
      offset: 1 + Math.floor((i * UPCOMING_WINDOW_DAYS) / UPCOMING.length),
    })),
  ];

  return planned.map(({ template, offset }, index) => {
    const addedOffset = Math.min(offset, 0) - (2 + (index % 5));
    return {
      id: createId(),
      name: template.name,
      barcode: template.hasBarcode ? fakeEan13(index + 1) : null,
      quantity: template.quantity,
      unit: template.unit,
      expiresOn: toIsoDate(addDays(today, offset)),
      dateKind: template.dateKind,
      location: template.location,
      addedOn: toIsoDate(addDays(today, addedOffset)),
      status: 'en-stock',
    };
  });
}
