import type { Page } from '@playwright/test'
import { expect, test, type KurioApp } from './support/fixtures'
import { NFTS } from './support/test-data'

function summaryValue(app: KurioApp, label: string) {
  return app.visible(
    app.page.locator('dl > div').filter({ has: app.page.getByText(label, { exact: true }) }),
  )
}

function lineQuantity(app: KurioApp, name: string) {
  return app.visible(app.page.getByRole('group', { name: `Quantidade de ${name}` }))
}

async function applyCoupon(app: KurioApp, code: string) {
  const field = app.visible(app.page.getByLabel('Código promocional'))
  await field.fill(code)
  await field.press('Enter')
}

function cartItems(page: Page) {
  return page.getByRole('list', { name: 'Itens do carrinho' }).filter({ visible: true })
}

test.describe('Carrinho', () => {
  test('altera quantidades, recalcula valores e remove itens', async ({ app, page }) => {
    await app.open('/')
    await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)
    await expect(cartItems(page).getByRole('listitem')).toHaveCount(1)
    await expect(summaryValue(app, 'Subtotal')).toContainText('1.19 ETH')

    const quantity = lineQuantity(app, NFTS.emeraldApe.name)
    await quantity.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(quantity.locator('output')).toHaveText('2')
    await expect(summaryValue(app, 'Subtotal')).toContainText('2.38 ETH')
    await expect(summaryValue(app, 'Total')).toContainText('2.396 ETH')

    await quantity.getByRole('button', { name: 'Diminuir quantidade' }).click()
    await expect(quantity.locator('output')).toHaveText('1')
    await expect(summaryValue(app, 'Subtotal')).toContainText('1.19 ETH')

    const remove = app.isMobile
      ? quantity.getByRole('button', { name: /^Remover quantidade/ })
      : app.visible(
          page.getByRole('button', { name: `Remover ${NFTS.emeraldApe.name} do carrinho` }),
        )
    await remove.click()
    await expect(app.toast(`${NFTS.emeraldApe.name} foi removido do carrinho.`)).toBeVisible()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('aplica, rejeita e remove cupons com o resumo coerente', async ({ app, page }) => {
    await app.open('/')
    await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)

    await applyCoupon(app, 'NAOEXISTE')
    await expect(app.visible(page.getByText('Este cupom não existe.'))).toBeVisible()

    await applyCoupon(app, 'EXPIRADO')
    await expect(app.visible(page.getByText('Este cupom expirou.'))).toBeVisible()

    await applyCoupon(app, 'KURIO10')
    await expect(page).toHaveURL(/cupom=KURIO10/)
    await expect(app.visible(page.getByText(/Cupom\s*KURIO10\s*aplicado/))).toBeVisible()
    await expect(summaryValue(app, 'Desconto do lançamento')).toContainText('(-) 0.119 ETH')
    await expect(summaryValue(app, 'Total')).toContainText('1.087 ETH')

    await app.reload()
    await expect(summaryValue(app, 'Total')).toContainText('1.087 ETH')

    await app.visible(page.getByRole('button', { name: 'Remover', exact: true })).click()
    await expect(page).not.toHaveURL(/cupom=/)
    await expect(summaryValue(app, 'Total')).toContainText('1.206 ETH')
  })

  test('mantém o carrinho após recarregar e preserva os itens do visitante ao entrar', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)
    await app.addToCartAndOpenCart(NFTS.goldenBeat.slug)
    await expect(cartItems(page).getByRole('listitem')).toHaveCount(2)

    await app.reload()
    await expect(cartItems(page).getByRole('listitem')).toHaveCount(2)

    await app.signIn()
    await expect(cartItems(page).getByRole('listitem')).toHaveCount(2)
    await expect(summaryValue(app, 'Subtotal')).toContainText('2.18 ETH')

    await app.reload()
    await expect(cartItems(page).getByRole('listitem')).toHaveCount(2)
  })
})
