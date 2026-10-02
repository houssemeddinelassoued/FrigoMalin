import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 2, 12));
});

test('le chemin GitHub Pages respecte la casse du depot et des assets', async ({ request }) => {
  const response = await request.get('/FrigoMalin/');
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('/FrigoMalin/assets/');
});

test('le stock vide se charge sans données fictives', async ({ page }) => {
  await page.goto('./#/stock');
  await expect(page).toHaveTitle('FrigoMalin');
  await expect(page.getByRole('heading', { level: 1, name: 'Mon stock' })).toBeVisible();
  await expect(page.getByText('Votre frigo attend ses premiers aliments')).toBeVisible();
});

test('les routes dates et consommation restent accessibles après rechargement', async ({
  page,
}) => {
  await page.goto('./#/dates');
  await expect(page.getByRole('heading', { level: 1, name: 'Mon stock' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Urgent/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const datesResponse = await page.reload();
  expect(datesResponse?.status()).toBe(200);
  await expect(page).toHaveURL(/\/FrigoMalin\/#\/dates$/);
  await expect(page.getByRole('button', { name: /Urgent/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goto('./#/consommation');
  await expect(page.getByRole('heading', { level: 1, name: 'Bilan & impact' })).toBeVisible();
  const consumptionResponse = await page.reload();
  expect(consumptionResponse?.status()).toBe(200);
  await expect(page).toHaveURL(/\/FrigoMalin\/#\/consommation$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Bilan & impact' })).toBeVisible();
});

test('l’ajout, la consommation partielle et la congélation persistent', async ({ page }) => {
  await page.goto('./#/scanner');
  await page.getByLabel('Nom de l’aliment').fill('Tomates du jardin');
  await page.getByLabel('Date limite', { exact: true }).fill('2026-10-05');
  await page.getByLabel('Quantité', { exact: true }).fill('500');
  await page.getByLabel('Unité', { exact: true }).selectOption('g');
  await page.getByRole('button', { name: 'Enregistrer dans mon stock', exact: true }).click();
  const card = page.getByRole('listitem').filter({ hasText: 'Tomates du jardin' });
  await expect(card).toContainText('500 g');
  await card.getByRole('button', { name: 'Consommé', exact: true }).click();
  await page.getByLabel('Quantité consommée (g)').fill('200');
  await page.getByRole('button', { name: 'Confirmer la consommation' }).click();
  await expect(card).toContainText('300 g');
  await page.reload();
  await expect(card).toContainText('300 g');
  await card.getByRole('button', { name: 'Congeler' }).click();
  await expect(card).toContainText('congélateur');
  await expect(card).toContainText('DLC J+3');
  await page.getByRole('link', { name: 'Impact', exact: true }).click();
  await expect(page.locator('.impact-stat').first()).toContainText('0,2');
});

test('le stock de démonstration distingue les DLC et les DDM', async ({ page }) => {
  await page.goto('./#/stock');
  await page.getByRole('button', { name: /Essayer avec un stock/ }).click();
  await expect(page.locator('.stock-list > li')).toHaveCount(40);
  const expired = page.locator('.stock-card.expired').first();
  await expect(expired).toContainText('Ne pas consommer');
  await expect(expired.getByRole('button', { name: 'Consommé' })).toHaveCount(0);
  await expect(
    page.getByText('DDM : vérifier l’aspect, l’odeur et la qualité').first(),
  ).toBeVisible();
  await page.getByRole('button', { name: /^Frigo/ }).click();
  await expect(page.locator('.stock-card')).toHaveCount(24);
});

test('les recettes se filtrent et affichent leurs étapes', async ({ page }) => {
  await page.goto('./#/recipes');
  await page.getByRole('button', { name: '≤ 15 min express' }).click();
  await expect(
    page.getByRole('heading', { name: 'Bowl express saumon tiède & riz', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voir la recette & cuisiner' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Préparation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Tous les ingrédients dans mon stock').check();
  await expect(page.getByText('Pas encore de recette pour ces critères')).toBeVisible();
});

test('Open Food Facts préremplit le nom et conserve la saisie manuelle', async ({ page }) => {
  await page.route('https://world.openfoodfacts.org/**', (route) =>
    route.fulfill({
      json: {
        status: 1,
        product: { product_name: 'Mozzarella test', brands: 'Galbani', quantity: '125 g' },
      },
    }),
  );
  await page.goto('./#/scanner');
  await page.getByRole('button', { name: 'Code-barres', exact: true }).click();
  await page.getByLabel('Code EAN du produit').fill('8000430000216');
  await page.getByRole('button', { name: 'Rechercher sur Open Food Facts' }).click();
  await expect(page.getByLabel('Nom de l’aliment')).toHaveValue('Mozzarella test');
  await page.unroute('https://world.openfoodfacts.org/**');
  await page.route('https://world.openfoodfacts.org/**', (route) => route.abort());
  await page.getByRole('button', { name: 'Rechercher sur Open Food Facts' }).click();
  await expect(page.getByRole('alert')).toContainText('manuellement');
  await page.getByRole('button', { name: 'Manuel', exact: true }).click();
  await expect(page.getByLabel('Nom de l’aliment')).toBeEditable();
});

for (const width of [390, 1440]) {
  test(`les quatre maquettes s’affichent sans débordement à ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./#/stock');
    await page.getByRole('button', { name: /Essayer avec un stock/ }).click();
    await expect(page.locator('.stock-card')).toHaveCount(40);
    for (const view of ['stock', 'recipes', 'scanner', 'impact']) {
      await page.goto(`./#/${view}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() =>
        Array.from(document.images)
          .filter((image) => {
            const rect = image.getBoundingClientRect();
            return rect.top < innerHeight && rect.bottom > 0;
          })
          .every((image) => image.complete && image.naturalWidth > 0),
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const notification = page.getByRole('button', { name: 'Fermer le message' });
      if (await notification.isVisible()) await notification.click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `test-results/stitch-${view}-${width}.png`,
        fullPage: view !== 'stock',
        animations: 'disabled',
      });
    }
  });
}
