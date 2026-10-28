import { expect, test } from './support/fixtures'
import { NFTS } from './support/test-data'

test.describe('Detalhe do NFT', () => {
  test('abre por acesso direto com preço, edição e quantidade', async ({ app, page }) => {
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`)
    await expect(
      app.visible(page.getByRole('heading', { level: 1, name: NFTS.emeraldApe.name })),
    ).toBeVisible()
    await expect(app.visible(page.getByText(NFTS.emeraldApe.price))).toBeVisible()
    await expect(app.visible(page.getByRole('radio', { name: /1\/50/ }))).toBeChecked()
  })

  test('trata NFT inexistente', async ({ app, page }) => {
    await app.open('/nfts/nft-que-nao-existe')
    await expect(page.getByText('NFT não encontrado')).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
    await expect(page).toHaveURL('/')
  })

  test('bloqueia a compra de edição esgotada e respeita o limite de quantidade', async ({
    app,
    page,
  }) => {
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`)
    await app.setEditionAvailability(NFTS.emeraldApe.slug, '1-10', 0)
    await app.setEditionAvailability(NFTS.emeraldApe.slug, '1-50', 2)

    const quantity = app.visible(page.getByRole('group', { name: 'Quantidade' }))
    const increase = quantity.getByRole('button', { name: 'Aumentar quantidade' })
    await increase.click()
    await expect(quantity.locator('output')).toHaveText('2')
    await expect(increase).toBeDisabled()

    await app.visible(page.locator('label').filter({ hasText: /^1\/10/ })).click()
    await expect(
      page.getByRole('radio', { name: /1\/10\s*, esgotada/i, checked: true }).first(),
    ).toBeAttached()
    await expect(app.visible(page.getByText(/Esta edição está esgotada/))).toBeVisible()
    await expect(app.buyButton()).toBeDisabled()
    await expect(page).toHaveURL(/edicao=1-10/)
  })
})
