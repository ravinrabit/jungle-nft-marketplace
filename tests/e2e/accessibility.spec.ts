import { expect, test } from './support/fixtures'
import { NFTS } from './support/test-data'

test.describe('Acessibilidade e teclado', () => {
  test('o link de atalho leva o foco ao conteúdo principal', async ({ app, page }) => {
    await app.open('/')
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skipLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#conteudo')).toBeFocused()
  })

  test('abre um NFT do catálogo pelo teclado', async ({ app, page }) => {
    await app.open('/')
    const cardLink = page
      .getByRole('list', { name: 'Resultados do catálogo' })
      .getByRole('heading', { level: 3 })
      .first()
      .getByRole('link')
    const name = await cardLink.innerText()
    await cardLink.focus()
    await page.keyboard.press('Enter')
    await expect(app.visible(page.getByRole('heading', { level: 1, name }))).toBeVisible()
  })

  test('o diálogo de login prende o foco e devolve ao gatilho ao fechar', async ({ app, page }) => {
    await app.open('/')
    const trigger = app.visible(
      app.isMobile
        ? page.getByRole('button', { name: 'Entrar na conta' })
        : page.getByRole('banner').getByRole('button', { name: 'Entrar' }),
    )
    await trigger.focus()
    await page.keyboard.press('Enter')

    const dialog = app.authDialog
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('E-mail')).toBeFocused()

    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('valida o login e associa as mensagens aos campos', async ({ app, page }) => {
    await app.open('/?auth=entrar')
    const dialog = app.authDialog
    await dialog.getByLabel('E-mail').press('Enter')

    const email = dialog.getByLabel('E-mail')
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toBeFocused()
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`[id="${describedBy ?? ''}"]`)).toContainText(
      'Informe um e-mail válido',
    )
  })

  test('o pagamento mostra e foca o campo inválido', async ({ app, page }) => {
    await app.open('/')
    await app.signIn()
    await app.addToCartAndOpenCart(NFTS.emeraldApe.slug)
    await app.checkoutButton().click()
    await expect(app.confirmPurchaseButton()).toBeEnabled()

    if (app.isMobile) {
      await page.getByRole('button', { name: 'Perfil do colecionador' }).click()
    }
    const displayName = page.getByLabel(/^Nome de exibição/)
    await displayName.fill('')
    if (app.isMobile) {
      await page.getByRole('button', { name: 'Perfil do colecionador' }).click()
    }
    await app.confirmPurchaseButton().click()

    await expect(displayName).toBeVisible()
    await expect(displayName).toBeFocused()
    await expect(displayName).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Informe pelo menos 2 caracteres').first()).toBeVisible()
    expect(await app.horizontalOverflow()).toBe(0)
  })
})
