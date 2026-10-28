import type { Request } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { ACCOUNTS, NFTS } from './support/test-data'

function isOrderCreation(request: Request) {
  return request.method() === 'POST' && new URL(request.url()).pathname === '/api/orders'
}

test.describe('Compra', () => {
  test('compra completa do catálogo ao recibo confirmado', async ({ app, page }) => {
    await app.open('/')
    const firstTitle = page
      .getByRole('list', { name: 'Resultados do catálogo' })
      .getByRole('heading', { level: 3 })
      .first()
    const name = await firstTitle.innerText()
    await firstTitle.getByRole('link').click()
    await expect(app.visible(page.getByRole('heading', { level: 1, name }))).toBeVisible()

    await app.buyButton().click()
    await page.waitForURL(/\/carrinho/)
    await app.checkoutButton().click()

    await expect(app.authDialog).toBeVisible()
    await app.submitSignIn(ACCOUNTS.collector)
    await page.waitForURL(/\/pagamento/)

    const review = await app.openReview()
    await expect(review.getByRole('list', { name: 'Itens do pedido' })).toContainText(name)
    const total = await review
      .locator('dl > div')
      .filter({ has: page.getByText('Total', { exact: true }) })
      .locator('dd')
      .innerText()
    await review.getByRole('button', { name: 'Assinar e confirmar' }).click()

    await page.waitForURL(/\/pedidos\//)
    await expect(page.getByRole('dialog', { name: 'Confirmando sua compra na rede' })).toBeVisible()
    const receipt = app.receipt()
    await expect(receipt).toBeVisible({ timeout: 10_000 })
    await expect(receipt.getByRole('list', { name: 'NFTs comprados' })).toContainText(name)
    await expect(receipt.getByText('ID da transação')).toBeVisible()
    await expect(receipt.getByText(/^0x[0-9a-f]{4}…[0-9a-f]{4}$/)).toBeVisible()
    await expect(receipt.getByText('Taxa de rede')).toBeVisible()
    await expect(receipt.getByText(total).first()).toBeVisible()
    await expect(receipt.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute(
      'href',
      /^https:\/\/etherscan\.io\/tx\/0x[0-9a-f]{64}$/,
    )

    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('mostra a recusa do pagamento e mantém os itens para nova tentativa', async ({
    app,
    page,
  }) => {
    await app.open('/', { scenario: 'payment-declined' })
    await app.signIn()
    await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)
    await app.checkoutButton().click()
    const review = await app.openReview()
    await review.getByRole('button', { name: 'Assinar e confirmar' }).click()

    const declined = page.getByRole('dialog', { name: 'O pagamento não foi concluído' })
    await expect(declined).toBeVisible({ timeout: 10_000 })
    await expect(declined).toContainText('A carteira recusou a assinatura da transação.')

    await app.setScenario('instant')
    await declined.getByRole('link', { name: 'Tentar novamente' }).click()
    await page.waitForURL(/\/pagamento/)
    await (await app.openReview()).getByRole('button', { name: 'Assinar e confirmar' }).click()
    await expect(app.receipt()).toBeVisible({ timeout: 10_000 })
  })

  test('clique repetido na assinatura cria um único pedido', async ({ app, page }) => {
    await app.open('/')
    await app.signIn()
    await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)
    await app.checkoutButton().click()
    const review = await app.openReview()
    await app.setScenario('slow')

    const creations: Request[] = []
    page.on('request', (request) => {
      if (isOrderCreation(request)) {
        creations.push(request)
      }
    })
    const sign = review.getByRole('button', { name: /Assinar e confirmar|Aguardando a carteira/ })
    await sign.click()
    await expect(sign).toBeDisabled()
    await sign.click({ force: true }).catch(() => undefined)
    await sign.dblclick({ force: true }).catch(() => undefined)

    await expect(app.receipt()).toBeVisible({ timeout: 15_000 })
    expect(creations).toHaveLength(1)
  })

  test('recupera o mesmo pedido após timeout usando a mesma chave de idempotência', async ({
    app,
    page,
  }) => {
    test.setTimeout(60_000)
    await app.open('/')
    await app.signIn()
    await app.addToCartAndOpenCart(NFTS.goldenBeat.slug)
    await app.checkoutButton().click()
    const review = await app.openReview()
    await app.setScenario('order-timeout')

    const keys: (string | undefined)[] = []
    page.on('request', (request) => {
      if (isOrderCreation(request)) {
        keys.push(request.headers()['idempotency-key'])
      }
    })
    await review.getByRole('button', { name: 'Assinar e confirmar' }).click()
    await expect(review.getByRole('button', { name: 'Aguardando a carteira…' })).toBeVisible()

    await page.waitForURL(/\/pedidos\//, { timeout: 30_000 })
    await expect(app.receipt()).toBeVisible({ timeout: 10_000 })
    expect(keys.length).toBeGreaterThanOrEqual(2)
    expect(new Set(keys).size).toBe(1)
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/)
  })
})
