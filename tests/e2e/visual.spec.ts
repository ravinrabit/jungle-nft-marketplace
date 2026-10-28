import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { NFTS } from './support/test-data'

const FIXED_NOW = new Date('2026-10-28T12:00:00-03:00')
const HIDE_TRANSIENT_UI = '[data-sonner-toaster] { display: none !important; }'

async function settle(page: Page) {
  await page.addStyleTag({ content: HIDE_TRANSIENT_UI })
  await page.evaluate(async () => {
    for (const image of Array.from(document.images)) {
      image.loading = 'eager'
    }
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.complete ? Promise.resolve() : image.decode().catch(() => undefined),
      ),
    )
  })
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

test.describe('Regressão visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(FIXED_NOW)
  })

  test('início', async ({ app, page }) => {
    await app.open('/')
    await expect(
      page.getByRole('list', { name: 'Resultados do catálogo' }).getByRole('listitem'),
    ).toHaveCount(9)
    await settle(page)
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('detalhe do NFT', async ({ app, page }) => {
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`)
    await expect(app.visible(page.getByText(NFTS.emeraldApe.price))).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('carrinho', async ({ app, page }) => {
    await app.open('/')
    await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)
    await app.addToCartAndOpenCart(NFTS.goldenBeat.slug)
    await expect(
      page.locator('dl > div').filter({ hasText: 'Total' }).filter({ visible: true }).last(),
    ).toContainText('2.196 ETH')
    await settle(page)
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('pagamento', async ({ app, page }) => {
    await app.open('/')
    await app.signIn()
    await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)
    await app.checkoutButton().click()
    await expect(app.confirmPurchaseButton()).toBeEnabled()
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
  })
})
