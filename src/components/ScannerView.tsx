import { useEffect, useRef, useState } from 'preact/hooks';
import {
  Barcode,
  CalendarDays,
  Check,
  ChevronRight,
  Minus,
  Package,
  PenLine,
  Plus,
  ReceiptText,
  Refrigerator,
  ScanLine,
  Snowflake,
} from 'lucide-preact';
import { localDate } from '../domain/stock';
import type { DateKind, StockItem, StorageLocation, Unit } from '../domain/types';
import { findProduct } from '../data/foodFacts';

interface ScannerViewProps {
  busy: boolean;
  onSave: (item: StockItem, another: boolean) => Promise<boolean>;
}

export default function ScannerView({ busy, onSave }: ScannerViewProps) {
  const [mode, setMode] = useState<'barcode' | 'manual'>('manual');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [location, setLocation] = useState<StorageLocation>('frigo');
  const [kind, setKind] = useState<DateKind>('DLC');
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>('pièce');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [productInfo, setProductInfo] = useState('');
  const requestRef = useRef(0);
  const productFromSearchRef = useRef(false);
  useEffect(
    () => () => {
      requestRef.current += 1;
    },
    [],
  );
  function invalidateSearch() {
    requestRef.current += 1;
    setSearching(false);
  }
  async function search() {
    const currentRequest = ++requestRef.current;
    setSearching(true);
    setError('');
    try {
      const product = await findProduct(barcode);
      if (currentRequest !== requestRef.current) return;
      setName(product.name);
      productFromSearchRef.current = true;
      setProductInfo([product.brand, product.quantity].filter(Boolean).join(' · '));
    } catch (failure) {
      if (currentRequest !== requestRef.current) return;
      setError(
        failure instanceof Error
          ? failure.message
          : 'Recherche indisponible. Saisissez le produit manuellement.',
      );
    } finally {
      if (currentRequest === requestRef.current) setSearching(false);
    }
  }
  const locations: { value: StorageLocation; label: string; icon: typeof Refrigerator }[] = [
    { value: 'frigo', label: 'Frigo', icon: Refrigerator },
    { value: 'congélateur', label: 'Congélateur', icon: Snowflake },
    { value: 'placard', label: 'Placard', icon: Package },
  ];
  async function save(another: boolean) {
    invalidateSearch();
    if (!name.trim() || !date || !Number.isFinite(quantity) || quantity <= 0) {
      setError('Renseignez le nom, une date et une quantité positive.');
      return;
    }
    const item: StockItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      barcode: barcode.trim() || null,
      quantity,
      unit,
      expiresOn: date,
      dateKind: kind,
      location,
      addedOn: localDate(new Date()),
      status: 'en-stock',
    };
    if (await onSave(item, another)) {
      setName('');
      setBarcode('');
      setDate('');
      setQuantity(1);
      setError('');
      setProductInfo('');
      productFromSearchRef.current = false;
    }
  }
  return (
    <div class="scanner-view">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Une place pour chaque aliment</span>
          <h1 tabIndex={-1}>Ajouter un aliment</h1>
        </div>
        <ScanLine class="heading-icon" size={32} />
      </div>
      <div class="connection-strip">
        <span>
          <span class="status-dot" /> Saisie locale disponible
        </span>
        <span>Votre frigo, à jour</span>
      </div>
      <div class="segmented scan-modes">
        <button type="button" aria-pressed={mode === 'barcode'} onClick={() => setMode('barcode')}>
          <Barcode size={20} /> Code-barres
        </button>
        <button type="button" disabled title="Le scan de ticket n’est pas disponible">
          <ReceiptText size={20} /> Ticket
        </button>
        <button
          type="button"
          aria-pressed={mode === 'manual'}
          onClick={() => {
            invalidateSearch();
            setMode('manual');
          }}
        >
          <PenLine size={20} /> Manuel
        </button>
      </div>
      {mode === 'barcode' && (
        <section class="barcode-panel">
          <ScanLine size={52} strokeWidth={1.3} />
          <h2>Recherche par code-barres</h2>
          <label for="barcode">Code EAN du produit</label>
          <input
            id="barcode"
            inputMode="numeric"
            maxLength={14}
            value={barcode}
            onInput={(event) => {
              invalidateSearch();
              if (productFromSearchRef.current) {
                setName('');
                setProductInfo('');
                productFromSearchRef.current = false;
              }
              setBarcode(event.currentTarget.value);
            }}
            placeholder="Ex. 8000430000216"
          />
          <button
            type="button"
            class="button primary full"
            disabled={searching}
            onClick={() => void search()}
          >
            <Barcode size={18} /> {searching ? 'Recherche…' : 'Rechercher sur Open Food Facts'}
          </button>
          <p>La date limite se renseigne depuis l’emballage.</p>
        </section>
      )}
      <form
        class="add-form"
        onSubmit={(event) => {
          event.preventDefault();
          void save(false);
        }}
      >
        <section class="form-section product-section">
          <span class="icon-tile green">
            <Package size={28} />
          </span>
          <div>
            <label for="product-name">Nom de l’aliment</label>
            <input
              id="product-name"
              required
              maxLength={120}
              placeholder="Ex. Mozzarella di Bufala"
              value={name}
              onInput={(event) => {
                invalidateSearch();
                productFromSearchRef.current = false;
                setProductInfo('');
                setName(event.currentTarget.value);
              }}
            />
            <span class="muted">{productInfo || 'Un nouveau produit, une nouvelle chance.'}</span>
          </div>
        </section>
        <fieldset class="storage-section">
          <legend>
            <Refrigerator size={20} /> Emplacement de stockage
          </legend>
          <div class="location-options">
            {locations.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                class={location === value ? 'selected' : ''}
                aria-pressed={location === value}
                onClick={() => setLocation(value)}
              >
                <Icon size={26} />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <section class="form-section">
          <div class="form-section-heading">
            <label for="expiry-date">
              <CalendarDays size={20} /> Date limite
            </label>
            <div class="segmented compact">
              {(['DLC', 'DDM'] as const).map((value) => (
                <button type="button" aria-pressed={kind === value} onClick={() => setKind(value)}>
                  {value}
                </button>
              ))}
            </div>
          </div>
          <input
            id="expiry-date"
            type="date"
            required
            value={date}
            onInput={(event) => setDate(event.currentTarget.value)}
          />
          <div class="date-shortcuts">
            {[3, 6, 15].map((days) => (
              <button
                type="button"
                class="button subtle"
                onClick={() => {
                  const next = new Date();
                  next.setDate(next.getDate() + days);
                  setDate(localDate(next));
                }}
              >
                +{days} jours
              </button>
            ))}
          </div>
          <p class="date-help">
            {kind === 'DLC'
              ? 'DLC : ne pas consommer après cette date.'
              : 'DDM : après cette date, vérifier la qualité du produit.'}
          </p>
        </section>
        <section class="form-section">
          <div class="form-section-heading">
            <label for="product-quantity">Quantité</label>
            <div class="quantity-stepper">
              <button
                type="button"
                title="Diminuer la quantité"
                aria-label="Diminuer la quantité"
                disabled={quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={18} />
              </button>
              <input
                id="product-quantity"
                type="number"
                required
                min="0.001"
                step="any"
                value={quantity}
                onInput={(event) => setQuantity(Number(event.currentTarget.value))}
              />
              <button
                type="button"
                title="Augmenter la quantité"
                aria-label="Augmenter la quantité"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <label for="product-unit">Unité</label>
          <select
            id="product-unit"
            value={unit}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (
                value === 'pièce' ||
                value === 'g' ||
                value === 'kg' ||
                value === 'ml' ||
                value === 'L'
              )
                setUnit(value);
            }}
          >
            {['pièce', 'g', 'kg', 'ml', 'L'].map((value) => (
              <option value={value}>{value}</option>
            ))}
          </select>
        </section>
        {error && (
          <p class="form-error" role="alert">
            {error}
          </p>
        )}
        <div class="save-actions">
          <button class="button primary full" disabled={busy}>
            <Check size={22} /> Enregistrer dans mon stock
          </button>
          <button
            class="button subtle full"
            type="button"
            disabled={busy}
            onClick={() => void save(true)}
          >
            <Plus size={18} /> Enregistrer & ajouter le suivant <ChevronRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
