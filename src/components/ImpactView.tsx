import { useState } from 'preact/hooks';
import {
  ArrowRight,
  Check,
  CloudOff,
  CookingPot,
  FileDown,
  Leaf,
  Lightbulb,
  PiggyBank,
  Scale,
  Share2,
  Sprout,
} from 'lucide-preact';
import { formatNumber } from '../domain/stock';
import { impactSummary, type ImpactPeriod } from '../domain/impact';
import type { Consumption, StockItem } from '../domain/types';

interface ImpactViewProps {
  stock: StockItem[];
  consumptions: Consumption[];
  today: Date;
  household: string;
  onMessage: (message: string) => void;
}

export default function ImpactView({
  stock,
  consumptions,
  today,
  household,
  onMessage,
}: ImpactViewProps) {
  const [period, setPeriod] = useState<ImpactPeriod>('month');
  const [tip, setTip] = useState<string | null>(null);
  const { entries, saved, weight, ratio, counts, amounts, recent } = impactSummary(
    stock,
    consumptions,
    today,
    period,
  );
  const month = today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const sections = [
    { title: 'Fruits & légumes', color: '#15803d' },
    { title: 'Produits laitiers', color: '#0075b1' },
    { title: 'Viandes & poissons', color: '#ff932c' },
    { title: 'Autres aliments', color: '#904d00' },
  ];
  let cumulative = 0;
  const slices = counts
    .map((count, index) => {
      const begin = cumulative;
      cumulative += saved.length ? (count / saved.length) * 100 : 0;
      return `${sections[index]?.color ?? '#15803d'} ${begin}% ${cumulative}%`;
    })
    .join(',');
  const points = amounts
    .map((amount, index) => `${20 + index * 120},${140 - (weight ? (amount / weight) * 110 : 0)}`)
    .join(' ');
  async function share() {
    const text = `FrigoMalin : ${formatNumber(weight)} kg de gaspillage évité estimé, d’après mes consommations déclarées.`;
    try {
      if (navigator.share) await navigator.share({ title: 'Mon bilan FrigoMalin', text });
      else {
        await navigator.clipboard.writeText(text);
        onMessage('Votre bilan a été copié.');
      }
    } catch {
      onMessage('Partage annulé ou indisponible sur cet appareil.');
    }
  }
  return (
    <div class="impact-view">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Les petits gestes font la différence</span>
          <h1 tabIndex={-1}>Bilan & impact</h1>
        </div>
        <button
          class="icon-button print-button"
          title="Imprimer ou enregistrer en PDF"
          aria-label="Imprimer le bilan"
          onClick={() => window.print()}
        >
          <FileDown size={23} />
        </button>
      </div>
      <div class="household-badge">
        <Leaf size={15} /> {household} · Bilan local
      </div>
      <div class="segmented period-options">
        <button aria-pressed={period === 'month'} onClick={() => setPeriod('month')}>
          {month}
        </button>
        <button aria-pressed={period === 'quarter'} onClick={() => setPeriod('quarter')}>
          3 derniers mois
        </button>
        <button aria-pressed={period === 'year'} onClick={() => setPeriod('year')}>
          Année {today.getFullYear()}
        </button>
      </div>
      <div class="impact-intro">
        <h2>Chaque sauvetage compte.</h2>
        <p>Vos consommations déclarées racontent vos bonnes habitudes.</p>
      </div>
      <section class="impact-stats">
        <article class="impact-stat">
          <div>
            <span class="icon-tile green">
              <Scale />
            </span>
            <span class="badge fresh">Déclaratif</span>
          </div>
          <strong class="green-text">
            {formatNumber(weight)}
            <small> kg</small>
          </strong>
          <h2>Aliments sauvés</h2>
          <p>Gaspillage évité estimé</p>
        </article>
        <article class="impact-stat">
          <div>
            <span class="icon-tile orange">
              <PiggyBank />
            </span>
            <span class="badge warm">Non estimé</span>
          </div>
          <strong class="amber-text">
            —<small> €</small>
          </strong>
          <h2>Budget préservé</h2>
          <p>Prix d’achat non renseignés</p>
        </article>
        <article class="impact-stat">
          <div>
            <span class="icon-tile blue">
              <CloudOff />
            </span>
            <span class="badge neutral">Non estimé</span>
          </div>
          <strong class="blue-text">
            —<small> kg CO₂e</small>
          </strong>
          <h2>Empreinte évitée</h2>
          <p>Facteurs d’émission non renseignés</p>
        </article>
        <article class="impact-stat">
          <div>
            <span class="icon-tile green">
              <Check />
            </span>
            <span class="green-text">{entries.length} déclarations</span>
          </div>
          <strong class="green-text">
            {entries.length ? formatNumber(ratio) : '—'}
            <small> %</small>
          </strong>
          <h2>Consommé à temps</h2>
          <div class="progress green-progress">
            <span style={{ width: `${ratio}%` }} />
          </div>
        </article>
      </section>
      <div class="impact-charts">
        <section class="chart-section">
          <div class="section-heading">
            <div>
              <h2>Évolution des sauvetages</h2>
              <p>Poids cumulé des consommations à temps</p>
            </div>
            <span class="badge fresh">{formatNumber(weight)} kg</span>
          </div>
          <svg
            class="saving-chart"
            viewBox="0 0 400 175"
            role="img"
            aria-label={`Poids cumulé : ${formatNumber(weight)} kilogrammes`}
          >
            <defs>
              <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#15803d" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#15803d" stop-opacity="0.02" />
              </linearGradient>
            </defs>
            {[30, 85, 140].map((height) => (
              <line
                x1="20"
                x2="380"
                y1={height}
                y2={height}
                stroke="#e4e9e6"
                stroke-dasharray="4 5"
              />
            ))}
            <polygon points={`20,140 ${points} 380,140`} fill="url(#chart-fill)" />
            <polyline
              points={points}
              fill="none"
              stroke="#15803d"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            {amounts.map((amount, index) => (
              <circle
                cx={20 + index * 120}
                cy={140 - (weight ? (amount / weight) * 110 : 0)}
                r="4.5"
                fill="white"
                stroke="#15803d"
                stroke-width="3"
              />
            ))}
            <text x="20" y="167" font-size="12" fill="#3f493f">
              Début
            </text>
            <text x="380" y="167" text-anchor="end" font-size="12" fill="#00652c">
              Dernière déclaration
            </text>
          </svg>
          {entries.length === 0 && (
            <p class="chart-empty">Votre première consommation fera démarrer la courbe.</p>
          )}
        </section>
        <section class="chart-section distribution-section">
          <div class="section-heading">
            <h2>Répartition des aliments sauvés</h2>
            <Leaf size={23} class="green-text" />
          </div>
          <div class="distribution">
            <div
              class="donut"
              style={{ background: saved.length ? `conic-gradient(${slices})` : '#e7eeff' }}
            >
              <div>
                <strong>{saved.length}</strong>
                <span>déclarations</span>
              </div>
            </div>
            <ul>
              {sections.map((section, index) => (
                <li>
                  <span class="legend-dot" style={{ background: section.color }} />
                  <span>{section.title}</span>
                  <strong>
                    {saved.length ? Math.round(((counts[index] ?? 0) / saved.length) * 100) : 0}%
                  </strong>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <section class="conservation-banner">
        <span class="icon-tile orange">
          <Lightbulb />
        </span>
        <div>
          <span class="eyebrow">Le bon geste FrigoMalin</span>
          <h2>Un bouquet de fraîcheur</h2>
          <p>
            Persil et coriandre : les tiges dans un fond d’eau, au réfrigérateur, sous un bocal en
            verre.
          </p>
          <button
            class="text-button"
            onClick={() =>
              setTip(
                tip
                  ? null
                  : 'Changez l’eau régulièrement et retirez les feuilles abîmées. Cette astuce ne prolonge pas une DLC.',
              )
            }
          >
            {tip ? 'Masquer le conseil' : 'Voir le conseil'} <ArrowRight size={16} />
          </button>
          {tip && <p>{tip}</p>}
        </div>
      </section>
      <section class="conservation-section">
        <div class="section-heading">
          <h2>Fiches conservation anti-gaspi</h2>
          <span class="green-text">2 conseils</span>
        </div>
        <div class="conservation-grid">
          <article>
            <span class="icon-tile green">
              <Sprout />
            </span>
            <div>
              <span class="green-text">Herbes fraîches</span>
              <h3>Astuce bouquet au frigo</h3>
              <p>Un fond d’eau et un bocal pour préserver la fraîcheur des herbes.</p>
            </div>
          </article>
          <article>
            <span class="icon-tile blue">
              <Check />
            </span>
            <div>
              <span class="blue-text">DLC ≠ DDM</span>
              <h3>Les dates, sans confusion</h3>
              <p>
                Une DDM dépassée invite à vérifier la qualité. Une DLC dépassée ne doit pas être
                consommée.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section class="recent-section">
        <div class="section-heading">
          <h2>Dernières denrées sauvées</h2>
          <span>Sur la période</span>
        </div>
        {recent.length ? (
          <ul>
            {recent.map((entry) => (
              <li>
                <span class="icon-tile white">
                  <CookingPot size={24} />
                </span>
                <div>
                  <h3>{stock.find((item) => item.id === entry.stockItemId)?.name ?? 'Aliment'}</h3>
                  <p>
                    {entry.consumedOn.split('-').reverse().join('/')} ·{' '}
                    {entry.beforeExpiry ? 'Consommé à temps' : 'Après la DDM'}
                  </p>
                </div>
                <strong class="green-text">
                  {formatNumber(entry.quantity)} {entry.unit}
                </strong>
              </li>
            ))}
          </ul>
        ) : (
          <p class="muted">Aucune consommation déclarée pour cette période.</p>
        )}
        <button class="button primary full" onClick={() => void share()}>
          <Share2 size={20} /> Partager mon bilan FrigoMalin
        </button>
      </section>
      <p class="impact-disclaimer">
        Estimation déclarative, pas une mesure vérifiée des déchets. Le poids inclut uniquement les
        quantités en g et kg consommées au plus tard à la date renseignée.
      </p>
    </div>
  );
}
