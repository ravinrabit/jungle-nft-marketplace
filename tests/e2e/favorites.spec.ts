import { expect, test } from './support/fixtures'
import { NFTS } from './support/test-data'

test.describe('Favoritos', () => {
  test('pede login ao visitante', async ({ app, page }) => {
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`)
    await app.visible(page.getByRole('button', { name: /^Favorit/ })).click()
    await expect(app.toast('Entre na sua conta para salvar favoritos.')).toBeVisible()
    await expect(app.authDialog).toBeVisible()
  })

  test('persiste após recarregar a página', async ({ app, page }) => {
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`)
    await app.signIn()
    const favorite = app.visible(page.getByRole('button', { name: /^Favorit/ }))
    await favorite.click()
    await expect(app.toast(`${NFTS.emeraldApe.name} foi adicionado aos favoritos.`)).toBeVisible()

    await app.reload()
    await expect(app.visible(page.getByRole('button', { name: /^Favorit/ }))).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('reverte a atualização otimista quando a mutation falha e recupera depois', async ({
    app,
    page,
  }) => {
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`, { scenario: 'favorites-error' })
    await app.signIn()
    const favorite = app.visible(page.getByRole('button', { name: /^Favorit/ }))

    await favorite.click()
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
    await expect(app.toast(/Não foi possível atualizar seus favoritos/)).toBeVisible()
    await expect(favorite).toHaveAttribute('aria-pressed', 'false')

    await app.setScenario('instant')
    await favorite.press('Enter')
    await expect(app.toast(/foi adicionado aos favoritos/)).toBeVisible()
    await app.reload()
    await expect(app.visible(page.getByRole('button', { name: /^Favorit/ }))).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
