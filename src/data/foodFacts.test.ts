import { afterEach, describe, expect, it, vi } from 'vitest';
import { findProduct } from './foodFacts';

afterEach(() => vi.unstubAllGlobals());

describe('Recherche Open Food Facts', () => {
  it('préremplit uniquement un nom produit validé', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 1,
            product: { product_name: 'Mozzarella', brands: 'Galbani', quantity: '125 g' },
          }),
        ),
      ),
    );
    expect(await findProduct('8000430000216')).toEqual({
      name: 'Mozzarella',
      brand: 'Galbani',
      quantity: '125 g',
    });
  });
  it('refuse un code invalide sans requête réseau', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(findProduct('invalid')).rejects.toThrow('code-barres');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('permet de revenir au manuel pour un produit inconnu ou une panne réseau', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 0 }))));
    await expect(findProduct('8000430000216')).rejects.toThrow('Saisissez');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(findProduct('8000430000216')).rejects.toThrow('manuellement');
  });
});
