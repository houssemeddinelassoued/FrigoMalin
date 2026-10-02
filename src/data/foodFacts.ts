interface ProductInfo {
  name: string;
  brand: string;
  quantity: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function findProduct(barcode: string): Promise<ProductInfo> {
  if (!/^\d{8,14}$/.test(barcode)) throw new Error('Saisissez un code-barres de 8 à 14 chiffres.');
  let response: Response;
  try {
    response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,quantity`,
      { signal: AbortSignal.timeout(10000) },
    );
  } catch {
    throw new Error('Recherche indisponible. Vous pouvez ajouter le produit manuellement.');
  }
  if (!response.ok)
    throw new Error('Open Food Facts est indisponible. Saisissez le produit manuellement.');
  const data: unknown = await response.json();
  if (!isRecord(data) || data['status'] !== 1 || !isRecord(data['product']))
    throw new Error('Produit inconnu. Saisissez le produit manuellement.');
  const product = data['product'];
  if (typeof product['product_name'] !== 'string' || !product['product_name'].trim())
    throw new Error('Nom du produit manquant. Saisissez le produit manuellement.');
  return {
    name: product['product_name'].trim().slice(0, 120),
    brand: typeof product['brands'] === 'string' ? product['brands'].slice(0, 120) : '',
    quantity: typeof product['quantity'] === 'string' ? product['quantity'].slice(0, 40) : '',
  };
}
