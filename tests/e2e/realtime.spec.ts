import { expect, test } from './support/fixtures'
import { NFTS } from './support/test-data'

test.describe('Tempo real com Socket.IO', () => {
  test('aplica preço e disponibilidade recebidos sem recarregar o detalhe', async ({
    app,
    page,
  }) => {
    const detailRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().endsWith(`/api/nfts/${NFTS.emeraldApe.slug}`)) {
        detailRequests.push(request.url())
      }
    })
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`)
    await expect(app.visible(page.getByText(NFTS.emeraldApe.price))).toBeVisible()
    const requestsBefore = detailRequests.length

    await app.setEditionPrice(NFTS.emeraldApe.slug, '1-50', '2.5')
    await expect(app.visible(page.getByText('2.50 ETH'))).toBeVisible()

    await app.setEditionAvailability(NFTS.emeraldApe.slug, '1-50', 0)
    await expect(app.visible(page.getByText(/Esta edição está esgotada/))).toBeVisible()
    expect(detailRequests).toHaveLength(requestsBefore)
  })

  test('alteração de preço durante o checkout exige revisar os novos valores', async ({ app }) => {
    await app.open('/')
    await app.signIn()
    await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)
    await app.checkoutButton().click()
    await app.setScenario('price-change-checkout')

    const review = await app.openReview()
    await expect(app.toast(`O preço de ${NFTS.emeraldApe.name} mudou para 1.24 ETH.`)).toBeVisible()

    await review.getByRole('button', { name: 'Assinar e confirmar' }).click()
    await expect(review.getByRole('alert')).toContainText('O preço de um item mudou')
    await expect(review.getByText('1.256 ETH')).toBeVisible()

    await app.setScenario('instant')
    await review.getByRole('button', { name: 'Assinar e confirmar' }).click()
    await expect(app.receipt()).toBeVisible({ timeout: 10_000 })
    await expect(app.receipt().getByText('1.256 ETH').first()).toBeVisible()
  })

  test('esgotar durante o checkout bloqueia a compra', async ({ app, page }) => {
    await app.open('/')
    await app.signIn()
    await app.addToCartAndOpenCart(NFTS.goldenBeat.slug)
    await app.checkoutButton().click()
    await expect(app.confirmPurchaseButton()).toBeEnabled()

    await app.setEditionAvailability(NFTS.goldenBeat.slug, '1-50', 0)
    await expect(app.toast(`${NFTS.goldenBeat.name} esgotou nesta edição.`)).toBeVisible()
    await expect(app.confirmPurchaseButton()).toBeDisabled()
    await expect(page.getByText(/Há itens sem disponibilidade/)).toBeVisible()
  })

  test('ignora eventos duplicados e versões antigas', async ({ app, page }) => {
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`, { scenario: 'realtime-chaos' })
    await expect(app.visible(page.getByText(NFTS.emeraldApe.price))).toBeVisible()

    for (const price of ['3.1', '3.2', '3.3']) {
      await app.setEditionPrice(NFTS.emeraldApe.slug, '1-50', price)
    }
    const currentPrice = app.visible(page.getByText('Preço da edição selecionada:').locator('..'))
    await expect(currentPrice).toContainText('3.30 ETH')
    await page.waitForTimeout(1_000)
    await expect(currentPrice).toContainText('3.30 ETH')
  })

  test('reconecta, reconcilia o evento perdido e retoma o pedido pendente', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.signIn()
    await app.addToCartAndOpenCart(NFTS.goldenBeat.slug)

    await app.control('disconnectRealtime')
    await expect(page.getByText(/Atualizações em tempo real desconectadas/)).toBeVisible()
    await app.setEditionPrice(NFTS.goldenBeat.slug, '1-50', '1.75')
    await expect(app.toast('Atualizações em tempo real restabelecidas.')).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      app.visible(page.locator('dl > div').filter({ has: page.getByText('Subtotal') })),
    ).toContainText('1.75 ETH')

    const frozenAt = Date.now()
    await page.clock.setFixedTime(frozenAt)
    await app.checkoutButton().click()
    const review = await app.openReview()
    await review.getByRole('button', { name: 'Assinar e confirmar' }).click()
    await page.waitForURL(/\/pedidos\//)
    const orderUrl = page.url()
    await expect(page.getByRole('dialog', { name: 'Confirmando sua compra na rede' })).toBeVisible()

    await page.goto('/pagamento')
    await expect(page.getByText('Você tem uma compra em processamento')).toBeVisible()
    await page.getByRole('link', { name: 'Acompanhar pedido' }).click()
    await expect(page).toHaveURL(orderUrl)
    await expect(page.getByRole('dialog', { name: 'Confirmando sua compra na rede' })).toBeVisible()

    await page.clock.setFixedTime(frozenAt + 10_000)
    await expect(app.receipt()).toBeVisible({ timeout: 10_000 })
  })

  test('avisa quando o tempo real está indisponível', async ({ app, page }) => {
    await app.open('/', { scenario: 'realtime-offline' })
    await expect(page.getByText(/Atualizações em tempo real indisponíveis/)).toBeVisible({
      timeout: 10_000,
    })
  })
})
