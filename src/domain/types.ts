export type Unit = 'pièce' | 'g' | 'kg' | 'ml' | 'L';

export type StorageLocation = 'frigo' | 'congélateur' | 'placard';

/** DLC : ne pas consommer après la date. DDM : qualité possiblement réduite après la date. */
export type DateKind = 'DLC' | 'DDM';

export type StockStatus = 'en-stock' | 'consommé' | 'jeté';

/** Date calendaire locale au format ISO 8601 AAAA-MM-JJ. */
export type IsoDate = string;

export interface StockItem {
  id: string;
  name: string;
  /** EAN-13 ; null pour les produits sans code-barres (vrac, restes). */
  barcode: string | null;
  quantity: number;
  unit: Unit;
  expiresOn: IsoDate | null;
  dateKind: DateKind;
  location: StorageLocation;
  addedOn: IsoDate;
  status: StockStatus;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
  minutes: number;
}

/** Consommation déclarée ; sert au calcul de l'estimation du gaspillage évité. */
export interface Consumption {
  id: string;
  stockItemId: string;
  quantity: number;
  unit: Unit;
  consumedOn: IsoDate;
  /** Vrai si la consommation est déclarée au plus tard à la date renseignée. */
  beforeExpiry: boolean;
}

export type ExpiryState = 'dépassée' | 'à consommer bientôt' | 'qualité à vérifier' | 'ok';
