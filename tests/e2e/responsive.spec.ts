import { expect, test } from './support/fixtures'
import { NFTS } from './support/test-data'

const SMALL_DESKTOP_WIDTHS = [900, 960, 1024] as const

test.describe('Desktop estreito', () => {
  test.skip(({ isMobile }) => isMobile, 'Cobre larguras de notebook com zoom e janelas menores')

  for (const width of SMALL_DESKTOP_WIDTHS) {
    test(`usa o layout desktop sem barra inferior e sem overflow em ${width}px`, async ({
      app,
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await app.open('/')
      await app.signIn()

      const screens = ['/', `/nfts/${NFTS.emeraldApe.slug}`, '/perfil', '/perfil/carteiras']
      for (const path of screens) {
        await page.goto(path)
        await app.waitForMocks()
        await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
        await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeHidden()
        expect(await app.horizontalOverflow(), path).toBe(0)
      }

      await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)
      expect(await app.horizontalOverflow(), '/carrinho').toBe(0)
      await app.checkoutButton().click()
      await expect(app.confirmPurchaseButton()).toBeEnabled()
      expect(await app.horizontalOverflow(), '/pagamento').toBe(0)
    })
  }
})
