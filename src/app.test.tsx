import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app.tsx';
import { closeDb, getDb } from './data/db';
import { addStock, loadHousehold } from './data/stock';
import type { StockItem } from './domain/types';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 2));
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

afterEach(async () => {
  const db = await getDb();
  await db.clear('stock');
  await db.clear('consumptions');
  await closeDb();
  window.location.hash = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('revérifie la DLC à l’instant de la consommation après minuit', async () => {
    const item: StockItem = {
      id: 'midnight',
      name: 'Crème du jour',
      barcode: null,
      quantity: 200,
      unit: 'g',
      expiresOn: '2026-10-02',
      dateKind: 'DLC',
      location: 'frigo',
      addedOn: '2026-10-01',
      status: 'en-stock',
    };
    await addStock(item);
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Consommé', exact: true }));
    vi.setSystemTime(new Date(2026, 9, 3));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la consommation' }));
    expect(
      await screen.findByText('DLC dépassée : ne consommez pas cet aliment.'),
    ).toBeInTheDocument();
    expect((await loadHousehold()).consumptions).toHaveLength(0);
  });

  it('ignore une réponse produit devenue obsolète après modification du code', async () => {
    let resolveResponse: (response: Response) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve;
          }),
      ),
    );
    window.location.hash = '/scanner';
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Code-barres', exact: true }));
    fireEvent.input(screen.getByLabelText('Code EAN du produit'), {
      target: { value: '8000430000216' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher sur Open Food Facts' }));
    fireEvent.input(screen.getByLabelText('Code EAN du produit'), {
      target: { value: '3017620422003' },
    });
    await act(() => {
      resolveResponse(
        new Response(JSON.stringify({ status: 1, product: { product_name: 'Ancien produit' } })),
      );
    });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Rechercher sur Open Food Facts' }),
      ).not.toBeDisabled(),
    );
    expect(screen.getByLabelText('Nom de l’aliment')).toHaveValue('');
  });

  it('affiche le stock vide sans injecter de données de démonstration', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Mon stock' })).toBeInTheDocument();
    expect(await screen.findByText('Votre frigo attend ses premiers aliments')).toBeInTheDocument();
    await expect((await getDb()).count('stock')).resolves.toBe(0);
  });

  it('ajoute un aliment et le retrouve dans le stock', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('link', { name: 'Ajouter un aliment' }));
    const name = await screen.findByLabelText('Nom de l’aliment');
    fireEvent.input(name, { target: { value: 'Tomates du jardin' } });
    fireEvent.input(screen.getByLabelText('Date limite'), { target: { value: '2026-10-12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer dans mon stock' }));
    await waitFor(() => expect(screen.getByText('Tomates du jardin')).toBeInTheDocument());
    await expect((await getDb()).count('stock')).resolves.toBe(1);
  });

  it('ouvre les recettes et leurs étapes puis le bilan', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('link', { name: 'Recettes' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Voir la recette & cuisiner' }));
    expect(await screen.findByRole('heading', { name: 'Préparation' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la recette' }));
    fireEvent.click(screen.getByRole('link', { name: 'Impact' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bilan & impact' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Gaspillage évité estimé')).toBeInTheDocument();
  });

  it('ouvre les urgences du stock depuis la route dates', async () => {
    window.location.hash = '/dates';
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Mon stock' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Urgent/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('ouvre le bilan depuis la route consommation', async () => {
    window.location.hash = '/consommation';
    render(<App />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bilan & impact' }),
    ).toBeInTheDocument();
  });

  it('replace le focus sur le titre lors du passage à la route dates', async () => {
    window.location.hash = '/stock';
    render(<App />);
    await screen.findByRole('heading', { level: 1, name: 'Mon stock' });
    fireEvent.click(screen.getByRole('link', { name: /urgents/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Urgent/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('heading', { level: 1, name: 'Mon stock' })).toHaveFocus();
    });
  });

  it('conserve un aliment sans date dans le stock mais hors des urgences', async () => {
    const undatedItem: StockItem = {
      id: 'undated',
      name: 'Restes de légumes',
      barcode: null,
      quantity: 1,
      unit: 'pièce',
      expiresOn: null,
      dateKind: 'DDM',
      location: 'frigo',
      addedOn: '2026-10-02',
      status: 'en-stock',
    };
    await addStock(undatedItem);
    render(<App />);

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Restes de légumes' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Urgent/ }));
    expect(screen.getByText('Aucun aliment pour ce filtre.')).toBeInTheDocument();
  });
});
