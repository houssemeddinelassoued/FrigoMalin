import { useEffect, useRef, useState } from 'preact/hooks';
import { ArrowLeft, Leaf, Refrigerator, Timer, X } from 'lucide-preact';
import Navigation, { type View } from './components/Navigation';
import StockView from './components/StockView';
import ScannerView from './components/ScannerView';
import RecipesView from './components/RecipesView';
import ImpactView from './components/ImpactView';
import HouseholdView from './components/HouseholdView';
import {
  addStock,
  consumeStock,
  discardStock,
  loadDemo,
  loadHousehold,
  moveStock,
  type HouseholdState,
} from './data/stock';
import { remainingDays } from './domain/stock';
import type { StockItem } from './domain/types';

function currentView(): View {
  const route = window.location.hash.slice(2);
  if (route === 'recipes' || route === 'scanner' || route === 'impact' || route === 'household')
    return route;
  if (route === 'consommation') return 'impact';
  return 'stock';
}

export function App() {
  const [view, setView] = useState<View>(currentView);
  const [urgentRoute, setUrgentRoute] = useState(() => window.location.hash.slice(2) === 'dates');
  const [state, setState] = useState<HouseholdState>({ stock: [], consumptions: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [household, setHousehold] = useState(() => {
    try {
      return localStorage.getItem('frigomalin-household') || 'Mon foyer';
    } catch {
      return 'Mon foyer';
    }
  });
  const [people, setPeople] = useState(() => {
    try {
      const count = Number(localStorage.getItem('frigomalin-people'));
      return count >= 1 && count <= 12 ? count : 4;
    } catch {
      return 4;
    }
  });
  const main = useRef<HTMLElement>(null);
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setToday(new Date());
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  useEffect(() => {
    const update = () => {
      setView(currentView());
      setUrgentRoute(window.location.hash.slice(2) === 'dates');
      setError('');
    };
    window.addEventListener('hashchange', update);
    void loadHousehold()
      .then(setState)
      .catch(() =>
        setError(
          'Impossible d’ouvrir le stockage local. Vérifiez les permissions de votre navigateur.',
        ),
      )
      .finally(() => setLoading(false));
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    main.current?.querySelector('h1')?.focus();
    window.scrollTo?.(0, 0);
  }, [view, loading, urgentRoute]);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(''), 6000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  async function action(operation: () => Promise<void>, feedback: string): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await operation();
      setState(await loadHousehold());
      setMessage(feedback);
      return true;
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Enregistrement impossible. Le stockage local est peut-être plein.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(item: StockItem, another: boolean): Promise<boolean> {
    const success = await action(() => addStock(item), `${item.name} ajouté à votre stock.`);
    if (success && !another) window.location.hash = '/stock';
    return success;
  }
  const urgent = state.stock.filter(
    (item) =>
      item.status === 'en-stock' &&
      item.expiresOn !== null &&
      remainingDays(item.expiresOn, today) <= 3,
  ).length;
  const labels = {
    stock: 'Mon stock',
    recipes: 'Recettes anti-gaspi',
    scanner: 'Ajouter un aliment',
    impact: 'Bilan & impact',
    household: 'Mon foyer',
  };
  return (
    <div class="app-shell">
      <Navigation view={view} />
      <div class="app-body">
        <header class="topbar">
          <div class="brand-lockup">
            {view === 'scanner' ? (
              <a
                class="icon-button"
                href="#/stock"
                title="Retour au stock"
                aria-label="Retour au stock"
              >
                <ArrowLeft size={22} />
              </a>
            ) : (
              <Refrigerator class="brand-icon" size={25} />
            )}
            <a href="#/stock" class="brand-name">
              FrigoMalin<small>{labels[view]}</small>
            </a>
          </div>
          <div class="header-actions">
            <a href="#/dates" class="urgent-badge">
              <Timer size={15} />
              {urgent} urgents
            </a>
            <a href="#/household" class="avatar" title="Mon foyer" aria-label="Mon foyer">
              <img src={`${import.meta.env.BASE_URL}images/recipes-1.png`} alt="" />
            </a>
          </div>
        </header>
        <main ref={main} class={`main-content view-${view}`}>
          {loading ? (
            <div class="empty-state" role="status">
              <Leaf size={32} />
              <p>Ouverture de votre frigo…</p>
            </div>
          ) : (
            <>
              {view === 'stock' && (
                <StockView
                  key={urgentRoute ? 'dates' : 'stock'}
                  initialFilter={urgentRoute ? 'urgent' : 'all'}
                  {...state}
                  today={today}
                  busy={busy}
                  onDemo={() =>
                    void action(
                      () => loadDemo(today),
                      'Stock de démonstration chargé : 40 aliments.',
                    )
                  }
                  onConsume={(id, quantity) =>
                    action(
                      () => consumeStock(id, quantity, new Date()),
                      'Consommation enregistrée. Merci de donner une chance à chaque aliment !',
                    )
                  }
                  onMove={(id, location) =>
                    void action(
                      () => moveStock(id, location, new Date()),
                      'Aliment déplacé. La date renseignée reste inchangée.',
                    )
                  }
                  onDiscard={(id) => void action(() => discardStock(id), 'Aliment déclaré jeté.')}
                />
              )}
              {view === 'scanner' && <ScannerView busy={busy} onSave={save} />}
              {view === 'recipes' && (
                <RecipesView stock={state.stock} today={today} people={people} />
              )}
              {view === 'impact' && (
                <ImpactView {...state} today={today} household={household} onMessage={setMessage} />
              )}
              {view === 'household' && (
                <HouseholdView
                  household={household}
                  people={people}
                  state={state}
                  onSave={(name, count) => {
                    try {
                      localStorage.setItem('frigomalin-household', name);
                      localStorage.setItem('frigomalin-people', String(count));
                      setHousehold(name);
                      setPeople(count);
                      setMessage('Votre foyer a été enregistré.');
                    } catch {
                      setError('Impossible d’enregistrer votre foyer dans ce navigateur.');
                    }
                  }}
                />
              )}
            </>
          )}
        </main>
        <div class={`action-feedback ${error ? 'error' : ''}`} role="status" aria-live="polite">
          {(error || message) && (
            <>
              <span>{error || message}</span>
              <button
                class="icon-button"
                aria-label="Fermer le message"
                title="Fermer le message"
                onClick={() => {
                  setError('');
                  setMessage('');
                }}
              >
                <X size={18} />
              </button>
            </>
          )}
        </div>
        <footer class="page-footer">
          <Leaf size={14} /> Chaque aliment compte.
        </footer>
      </div>
    </div>
  );
}
