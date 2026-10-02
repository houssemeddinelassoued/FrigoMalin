import { useState } from 'preact/hooks';
import {
  ArrowRight,
  Check,
  ChefHat,
  Clock3,
  CookingPot,
  Heart,
  Leaf,
  Package,
  Sparkles,
  Users,
  Utensils,
  Zap,
} from 'lucide-preact';
import { recipeMatches, recipes, type RecipeDetails } from '../domain/recipes';
import { formatNumber } from '../domain/stock';
import type { StockItem } from '../domain/types';
import Modal from './Modal';

interface RecipesViewProps {
  stock: StockItem[];
  today: Date;
  people: number;
}

export default function RecipesView({ stock, today, people }: RecipesViewProps) {
  const [guests, setGuests] = useState(people);
  const [duration, setDuration] = useState('all');
  const [stockOnly, setStockOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selected, setSelected] = useState<RecipeDetails | null>(null);
  const catalog = recipes.filter(
    (recipe) =>
      (duration === 'all' ||
        (duration === 'express'
          ? recipe.minutes <= 15
          : duration === 'medium'
            ? recipe.minutes > 15 && recipe.minutes <= 30
            : recipe.minutes > 30)) &&
      (!stockOnly || recipeMatches(recipe, stock, today).every((entry) => entry.available)),
  );
  const featured = catalog[0];
  const match = featured ? recipeMatches(featured, stock, today) : [];
  const available = match.filter((entry) => entry.available).length;
  const ready = recipes.filter((recipe) =>
    recipeMatches(recipe, stock, today).every((entry) => entry.available),
  ).length;
  return (
    <div class="recipes-view">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Les meilleures idées sont déjà dans votre frigo</span>
          <h1 tabIndex={-1}>Recettes anti-gaspi</h1>
        </div>
        <CookingPot class="heading-icon" size={32} />
      </div>
      <section class="sync-banner">
        <div>
          <span class="status-dot" />
          <span>
            <strong>Stock local · frigo connecté</strong>
            <small>{ready} recettes avec tous les ingrédients présents</small>
          </span>
        </div>
        <Sparkles size={24} />
      </section>
      <div class="section-heading guest-heading">
        <span>
          <Users size={18} /> Convives au dîner
        </span>
        <span class="green-text">À votre table</span>
      </div>
      <div class="segmented guest-options">
        {[1, 2, 4].map((number) => (
          <button aria-pressed={guests === number} onClick={() => setGuests(number)}>
            <strong>{number === 4 ? '3–4' : number} pers.</strong>
            <small>{number === 1 ? 'En solo' : number === 2 ? 'En duo' : 'En famille'}</small>
          </button>
        ))}
      </div>
      <div class="filter-list recipe-filters">
        {[
          { value: 'all', label: 'Toutes', icon: CookingPot },
          { value: 'express', label: '≤ 15 min express', icon: Zap },
          { value: 'medium', label: '15–30 min', icon: Clock3 },
          { value: 'batch', label: 'Au four', icon: Package },
        ].map(({ value, label, icon: Icon }) => (
          <button
            class={`filter ${duration === value ? 'active' : ''}`}
            aria-pressed={duration === value}
            onClick={() => setDuration(value)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <label class="stock-toggle">
        <input
          type="checkbox"
          checked={stockOnly}
          onChange={(event) => setStockOnly(event.currentTarget.checked)}
        />{' '}
        Tous les ingrédients dans mon stock
      </label>
      <section class="saving-banner">
        <span class="icon-tile pale">
          <Leaf size={24} />
        </span>
        <div>
          <span>Potentiel de sauvetage ce soir</span>
          <strong>Une bonne idée, zéro oubli</strong>
        </div>
        <ArrowRight size={20} />
      </section>
      {featured ? (
        <div class="recipe-layout">
          <article class="featured-recipe">
            <div class="recipe-photo">
              <img
                src={`${import.meta.env.BASE_URL}images/${featured.image}.png`}
                alt={featured.title}
              />
              <span class="photo-badge">
                <Check size={14} /> {available}/{match.length} ingrédients présents
              </span>
              <button
                class={`favorite-button ${favorites.includes(featured.id) ? 'is-favorite' : ''}`}
                aria-label="Ajouter aux favoris"
                aria-pressed={favorites.includes(featured.id)}
                title="Ajouter aux favoris"
                onClick={() =>
                  setFavorites(
                    favorites.includes(featured.id)
                      ? favorites.filter((id) => id !== featured.id)
                      : [...favorites, featured.id],
                  )
                }
              >
                <Heart size={21} fill={favorites.includes(featured.id) ? 'currentColor' : 'none'} />
              </button>
              <div class="photo-meta">
                <span>
                  <Clock3 size={16} /> {featured.minutes} min
                </span>
                <span>
                  <ChefHat size={17} /> Facile
                </span>
              </div>
            </div>
            <div class="recipe-body">
              <div class="recipe-tags">
                <span class="badge danger">{featured.tag}</span>
                <span>Pour {guests} pers.</span>
              </div>
              <h2>{featured.title}</h2>
              <div class="recipe-ingredients">
                <span class="eyebrow">Ingrédients du frigo</span>
                <ul>
                  {match.map((ingredient) => (
                    <li>
                      <span>{ingredient.name}</span>
                      <span class={`badge ${ingredient.available ? 'fresh' : 'neutral'}`}>
                        {ingredient.available ? 'Présent' : 'À prévoir'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div class="recipe-benefit">
                <Leaf size={18} />
                <span>
                  {available
                    ? `${available} ingrédients de votre stock à valoriser`
                    : 'À préparer avec votre prochaine sélection'}
                </span>
              </div>
              <button class="button primary full" onClick={() => setSelected(featured)}>
                <Utensils size={19} /> Voir la recette & cuisiner
              </button>
              <p class="recipe-caption">La consommation se déclare ensuite dans le stock.</p>
            </div>
          </article>
          <section class="other-recipes">
            <div class="section-heading">
              <h2>Autres idées selon vos réserves</h2>
              <span class="green-text">{catalog.length - 1} idées</span>
            </div>
            <ul class="recipe-list">
              {catalog.slice(1).map((recipe) => {
                const matches = recipeMatches(recipe, stock, today);
                const count = matches.filter((entry) => entry.available).length;
                return (
                  <li>
                    <button class="recipe-row" onClick={() => setSelected(recipe)}>
                      <div class="recipe-thumb">
                        <img
                          src={`${import.meta.env.BASE_URL}images/${recipe.image}.png`}
                          alt=""
                          loading="lazy"
                        />
                        <span>{recipe.minutes} min</span>
                      </div>
                      <div class="recipe-row-info">
                        <div>
                          <span class={`badge ${count === matches.length ? 'fresh' : 'neutral'}`}>
                            {count}/{matches.length} présents
                          </span>
                          <span>{guests} pers.</span>
                        </div>
                        <h3>{recipe.title}</h3>
                        <p>
                          {matches
                            .filter((entry) => entry.available)
                            .map((entry) => entry.name)
                            .join(', ') || 'À compléter avec votre stock'}
                        </p>
                        <span class="recipe-row-tag">{recipe.tag}</span>
                      </div>
                      <span class="round-arrow">
                        <ArrowRight size={18} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      ) : (
        <section class="empty-state">
          <CookingPot size={40} />
          <h2>Pas encore de recette pour ces critères</h2>
          <button
            class="button subtle"
            onClick={() => {
              setDuration('all');
              setStockOnly(false);
            }}
          >
            Voir toutes les recettes
          </button>
        </section>
      )}
      {selected && (
        <Modal
          titleId="recipe-title"
          closeLabel="Fermer la recette"
          onClose={() => setSelected(null)}
        >
          <img
            class="modal-recipe-photo"
            src={`${import.meta.env.BASE_URL}images/${selected.image}.png`}
            alt=""
          />
          <span class="eyebrow">
            {selected.minutes} min · {guests} personnes
          </span>
          <h2 id="recipe-title">{selected.title}</h2>
          <h3>Ingrédients</h3>
          <ul class="ingredient-details">
            {recipeMatches(selected, stock, today).map((ingredient) => (
              <li>
                <span>
                  {ingredient.name} ·{' '}
                  {formatNumber((ingredient.quantity * guests) / selected.servings)}{' '}
                  {ingredient.unit}
                </span>
                <span class={`badge ${ingredient.available ? 'fresh' : 'warm'}`}>
                  {ingredient.available ? 'Présent' : 'À prévoir'}
                </span>
              </li>
            ))}
          </ul>
          <h3>Préparation</h3>
          <ol class="recipe-steps">
            {selected.steps.map((step) => (
              <li>{step}</li>
            ))}
          </ol>
          <a class="button primary full" href="#/stock">
            <Check size={18} /> Déclarer ma consommation
          </a>
        </Modal>
      )}
    </div>
  );
}
