import { useState } from 'preact/hooks';
import {
  ArrowDownUp,
  ArrowRight,
  Check,
  CookingPot,
  Leaf,
  Package,
  Plus,
  Refrigerator,
  Snowflake,
  Timer,
  Trash2,
  X,
} from 'lucide-preact';
import { dateLabel, expiryState, formatNumber, remainingDays, savedWeight } from '../domain/stock';
import type { Consumption, StockItem, StorageLocation } from '../domain/types';
import Modal from './Modal';

interface StockViewProps {
  stock: StockItem[];
  consumptions: Consumption[];
  today: Date;
  initialFilter: 'all' | 'urgent';
  busy: boolean;
  onDemo: () => void;
  onConsume: (id: string, quantity: number) => Promise<boolean>;
  onMove: (id: string, location: StorageLocation) => void;
  onDiscard: (id: string) => void;
}

function foodImage(name: string): string | null {
  const normalized = name.toLowerCase();
  const file = normalized.includes('crème')
    ? 'stock-2'
    : normalized.includes('saumon')
      ? 'stock-3'
      : normalized.includes('courgette')
        ? 'stock-4'
        : normalized.includes('yaourt')
          ? 'stock-5'
          : normalized.includes('mozzarella')
            ? 'scanner-2'
            : null;
  return file ? `${import.meta.env.BASE_URL}images/${file}.png` : null;
}

function isUrgent(item: StockItem, today: Date): boolean {
  return item.expiresOn !== null && remainingDays(item.expiresOn, today) <= 3;
}

export default function StockView({
  stock,
  consumptions,
  today,
  initialFilter,
  busy,
  onDemo,
  onConsume,
  onMove,
  onDiscard,
}: StockViewProps) {
  const [filter, setFilter] = useState<string>(initialFilter);
  const [descending, setDescending] = useState(false);
  const [mission, setMission] = useState(true);
  const [selected, setSelected] = useState<StockItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const active = stock.filter((item) => item.status === 'en-stock');
  const urgent = active.filter((item) => isUrgent(item, today));
  const monthEntries = consumptions.filter((entry) =>
    entry.consumedOn.startsWith(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
    ),
  );
  const consumed = stock.filter((item) => item.status === 'consommé').length;
  const discarded = stock.filter((item) => item.status === 'jeté').length;
  const valuation =
    consumed + discarded ? Math.round((consumed / (consumed + discarded)) * 100) : null;
  const visible = active
    .filter(
      (item) =>
        filter === 'all' ||
        (filter === 'urgent' ? isUrgent(item, today) : item.location === filter),
    )
    .sort((first, second) => {
      if (first.expiresOn === null) return second.expiresOn === null ? 0 : 1;
      if (second.expiresOn === null) return -1;
      return (descending ? -1 : 1) * first.expiresOn.localeCompare(second.expiresOn);
    });
  const filters = [
    { key: 'all', label: 'Tous', icon: Package },
    { key: 'urgent', label: 'Urgent', icon: Timer },
    { key: 'frigo', label: 'Frigo', icon: Refrigerator },
    { key: 'congélateur', label: 'Congélo', icon: Snowflake },
    { key: 'placard', label: 'Placard', icon: Package },
  ];

  return (
    <div class="stock-view">
      <div class="page-heading">
        <div>
          <span class="eyebrow">À portée de main, à temps dans l’assiette</span>
          <h1 tabIndex={-1}>Mon stock</h1>
        </div>
        <a class="button primary desktop-add" href="#/scanner">
          <Plus size={18} /> Ajouter un aliment
        </a>
      </div>
      {mission && active.length > 0 && (
        <section class="mission-banner">
          <div class="mission-top">
            <span class="icon-tile orange">
              <CookingPot />
            </span>
            <div>
              <h2>Mission du jour</h2>
              <p>
                <strong>{urgent.length} aliments</strong> à vérifier ou à consommer en priorité.
              </p>
            </div>
            <button
              class="icon-button"
              title="Masquer la mission"
              aria-label="Masquer la mission"
              onClick={() => setMission(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div class="mission-bottom">
            <span>Suggestion : une bonne idée avec vos réserves</span>
            <a class="button primary small" href="#/recipes">
              Idées anti-gaspi <ArrowRight size={16} />
            </a>
          </div>
        </section>
      )}
      <section class="stats-grid" aria-label="Résumé du stock">
        <article class="stat">
          <div class="stat-label">
            À consommer vite <Timer size={18} class="red-text" />
          </div>
          <strong class="stat-number red-text">
            {urgent.length}
            <small>aliments</small>
          </strong>
          <span>
            {
              active.filter(
                (item) => item.expiresOn !== null && remainingDays(item.expiresOn, today) === 0,
              ).length
            }{' '}
            à date aujourd’hui
          </span>
          <div class="progress">
            <span
              style={{ width: `${active.length ? (urgent.length / active.length) * 100 : 0}%` }}
            />
          </div>
        </article>
        <article class="stat">
          <div class="stat-label">
            Total stock <Package size={18} />
          </div>
          <strong class="stat-number">
            {active.length}
            <small>articles</small>
          </strong>
          <div class="storage-counts">
            <span>
              <Refrigerator size={13} />
              {active.filter((item) => item.location === 'frigo').length}
            </span>
            <span>
              <Snowflake size={13} />
              {active.filter((item) => item.location === 'congélateur').length}
            </span>
            <span>
              <Package size={13} />
              {active.filter((item) => item.location === 'placard').length}
            </span>
          </div>
        </article>
        <article class="stat">
          <div class="stat-label">
            Sauvés ce mois <Leaf size={18} />
          </div>
          <strong class="stat-number green-text">
            {formatNumber(savedWeight(monthEntries))}
            <small>kg</small>
          </strong>
          <span>Gaspillage évité estimé</span>
        </article>
        <article class="stat">
          <div class="stat-label">
            Valorisation <Check size={18} class="blue-text" />
          </div>
          <strong class="stat-number blue-text">
            {valuation === null ? '—' : `${valuation}%`}
          </strong>
          <span>
            {consumed} consommés · {discarded} jetés
          </span>
        </article>
      </section>
      <div class="filter-list" aria-label="Filtrer le stock">
        {filters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            aria-pressed={filter === key}
            class={`filter ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            <Icon size={15} />
            {label}
            <span>
              {key === 'all'
                ? active.length
                : key === 'urgent'
                  ? urgent.length
                  : active.filter((item) => item.location === key).length}
            </span>
          </button>
        ))}
      </div>
      <div class="section-heading">
        <h2>
          Priorités du moment <span class="badge neutral">{visible.length} articles</span>
        </h2>
        <button class="text-button" onClick={() => setDescending(!descending)}>
          <ArrowDownUp size={16} /> Trier : date {descending ? '↓' : '↑'}
        </button>
      </div>
      {active.length === 0 ? (
        <section class="empty-state">
          <span class="empty-icon">
            <Refrigerator size={48} strokeWidth={1.3} />
          </span>
          <h2>Votre frigo attend ses premiers aliments</h2>
          <p>Un premier produit, et une bonne habitude qui commence.</p>
          <a class="button primary" href="#/scanner">
            <Plus size={18} /> Ajouter le premier aliment
          </a>
          {stock.length === 0 && (
            <button class="text-button" disabled={busy} onClick={onDemo}>
              Essayer avec un stock de démonstration <ArrowRight size={16} />
            </button>
          )}
        </section>
      ) : visible.length === 0 ? (
        <p class="empty-state">Aucun aliment pour ce filtre.</p>
      ) : (
        <ul class="stock-list">
          {visible.map((item) => {
            const state = expiryState(item, today);
            const expired = item.dateKind === 'DLC' && state === 'dépassée';
            const image = foodImage(item.name);
            const LocationIcon =
              item.location === 'congélateur'
                ? Snowflake
                : item.location === 'frigo'
                  ? Refrigerator
                  : Package;
            return (
              <li
                key={item.id}
                class={`stock-card ${state === 'dépassée' ? 'expired' : state === 'à consommer bientôt' ? 'soon' : 'safe'}`}
              >
                <div class="food-row">
                  {image ? (
                    <img class="food-thumb" src={image} alt="" loading="lazy" />
                  ) : (
                    <span class="food-thumb food-placeholder">
                      <LocationIcon size={26} />
                    </span>
                  )}
                  <div class="food-info">
                    <div class="food-title">
                      <h3>{item.name}</h3>
                      <span
                        class={`badge ${expired ? 'danger' : state === 'à consommer bientôt' ? 'warm' : 'fresh'}`}
                      >
                        {dateLabel(item, today)}
                      </span>
                    </div>
                    <p>
                      {item.location} · {formatNumber(item.quantity)} {item.unit}
                    </p>
                    <span class={`food-note ${expired ? 'red-text' : ''}`}>
                      {expired
                        ? 'Ne pas consommer après la DLC'
                        : state === 'qualité à vérifier'
                          ? 'DDM : vérifier l’aspect, l’odeur et la qualité'
                          : state === 'à consommer bientôt'
                            ? 'À consommer bientôt'
                            : 'Encore un peu de fraîcheur'}
                    </span>
                  </div>
                </div>
                <div class="food-actions">
                  {expired ? (
                    <button
                      class="button subtle"
                      disabled={busy}
                      onClick={() => onDiscard(item.id)}
                    >
                      <Trash2 size={16} /> Déclarer jeté
                    </button>
                  ) : (
                    <>
                      <a class="button subtle" href="#/recipes">
                        <CookingPot size={16} /> Recette facile
                      </a>
                      {item.location !== 'congélateur' && (
                        <button
                          class="button ice"
                          disabled={busy}
                          title={`Congeler ${item.name}`}
                          onClick={() => onMove(item.id, 'congélateur')}
                        >
                          <Snowflake size={16} />
                          <span class="freeze-label">Congeler</span>
                        </button>
                      )}
                      <button
                        class="button primary"
                        disabled={busy}
                        onClick={() => {
                          setSelected(item);
                          setQuantity(String(item.quantity));
                        }}
                      >
                        <Check size={16} /> Consommé
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {active.length > 0 && (
        <section class="recipe-suggestion">
          <div class="eyebrow">
            <CookingPot size={16} /> Idée repas anti-gaspi du soir{' '}
            <span class="badge fresh">À partager</span>
          </div>
          <h2>
            Tarte salée courgettes,
            <br />
            saumon & crème
          </h2>
          <p>Les bons ingrédients font les meilleurs sauvetages.</p>
          <a href="#/recipes" class="button primary">
            <CookingPot size={18} /> Trouver une recette
          </a>
        </section>
      )}
      {selected && (
        <Modal
          titleId="consume-title"
          closeLabel="Fermer"
          onClose={() => {
            if (!busy) setSelected(null);
          }}
        >
          <span class="icon-tile green">
            <Leaf />
          </span>
          <h2 id="consume-title">Un aliment de plus sauvé</h2>
          <p>{selected.name}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onConsume(selected.id, Number(quantity)).then((success) => {
                if (success) setSelected(null);
              });
            }}
          >
            <label for="consumed-quantity">Quantité consommée ({selected.unit})</label>
            <input
              autoFocus
              id="consumed-quantity"
              type="number"
              min="0.001"
              max={selected.quantity}
              step="any"
              required
              value={quantity}
              onInput={(event) => setQuantity(event.currentTarget.value)}
            />
            <button class="button primary full" disabled={busy}>
              <Check size={18} /> Confirmer la consommation
            </button>
            <button class="button subtle full" type="button" onClick={() => setSelected(null)}>
              Annuler
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
