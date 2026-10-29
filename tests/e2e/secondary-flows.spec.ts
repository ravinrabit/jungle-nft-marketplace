import { expect, test } from './support/fixtures'
import { ACCOUNTS, NFTS } from './support/test-data'

test.describe('Lista de interesse', () => {
  test('mostra o estado vazio, lista os favoritos e remove ao desfavoritar', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await app.signIn()
    await page.goto('/perfil/favoritos')
    await expect(page.getByText('Sua lista de interesse está vazia')).toBeVisible()

    await page.goto(`/nfts/${NFTS.emeraldApe.slug}`)
    await app.visible(page.getByRole('button', { name: /^Favorit/ })).press('Enter')
    await expect(app.toast(`${NFTS.emeraldApe.name} foi adicionado aos favoritos.`)).toBeVisible()

    await page.goto('/perfil/favoritos')
    const favorites = page.getByRole('list', { name: 'NFTs favoritos' })
    await expect(favorites.getByRole('listitem')).toHaveCount(1)
    await expect(favorites).toContainText(NFTS.emeraldApe.name)

    await app
      .visible(favorites.getByRole('button', { name: `Favoritar ${NFTS.emeraldApe.name}` }))
      .press('Enter')
    await expect(page.getByText('Sua lista de interesse está vazia')).toBeVisible()
  })

  test('o atalho de favoritos exige login e volta para a lista', async ({ app, page }) => {
    test.skip(!app.isMobile, 'O atalho de favoritos fica na barra inferior do mobile')
    await app.open('/')
    await page.getByRole('link', { name: 'Lista de interesse' }).click()
    await expect(app.authDialog).toBeVisible()
    await app.submitSignIn(ACCOUNTS.collector)
    await expect(page).toHaveURL('/perfil/favoritos')
    await expect(
      page.getByRole('heading', { name: 'Lista de interesse', exact: true }),
    ).toBeVisible()
  })
})

test.describe('Recuperação de senha', () => {
  test('valida o e-mail e confirma o envio sem revelar se a conta existe', async ({
    app,
    page,
  }) => {
    await app.open('/?auth=entrar')
    await app.authDialog.getByRole('button', { name: 'Esqueceu a senha?' }).click()
    await expect(page).toHaveURL(/auth=recuperar/)
    const dialog = page.getByRole('dialog', { name: 'Recuperar senha' })

    await dialog.getByRole('button', { name: 'Enviar instruções' }).click()
    await expect(dialog.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')

    await dialog.getByLabel('E-mail').fill('ninguem@kurio.test')
    await dialog.getByRole('button', { name: 'Enviar instruções' }).click()
    await expect(dialog.getByRole('status')).toContainText(
      'Se existir uma conta com ninguem@kurio.test',
    )

    await dialog.getByRole('button', { name: 'Voltar para o login' }).click()
    await expect(page).toHaveURL(/auth=entrar/)
  })
})

test.describe('Rodapé e navegação', () => {
  test.skip(({ isMobile }) => isMobile, 'O rodapé e o menu do topo existem apenas no desktop')

  test('inscreve na newsletter e reconhece e-mail já inscrito', async ({ app, page }) => {
    await app.open('/')
    const footer = page.getByRole('contentinfo')
    const email = footer.getByLabel('E-mail para receber novidades')

    await email.fill('invalido')
    await footer.getByRole('button', { name: 'Enviar' }).click()
    await expect(footer.getByRole('alert')).toHaveText('Informe um e-mail válido')

    await email.fill('novidades@kurio.test')
    await footer.getByRole('button', { name: 'Enviar' }).click()
    await expect(app.toast(/Inscrição confirmada/)).toBeVisible()
    await expect(email).toHaveValue('')

    await email.fill('novidades@kurio.test')
    await footer.getByRole('button', { name: 'Enviar' }).click()
    await expect(app.toast('Este e-mail já está inscrito na newsletter.')).toBeVisible()
  })

  test('"Aprenda" leva ao Diário da Cunhagem', async ({ app, page }) => {
    await app.open('/nfts/emerald-ape-042')
    await page
      .getByRole('navigation', { name: 'Principal' })
      .getByRole('link', { name: 'Aprenda' })
      .click()
    await expect(page).toHaveURL('/#diario')
    await expect(page.getByRole('heading', { name: 'Diário da Cunhagem' })).toBeInViewport()
  })

  test('itens fora do escopo aparecem como "Em breve" e não são acionáveis', async ({
    app,
    page,
  }) => {
    await app.open('/')
    const header = page.getByRole('navigation', { name: 'Principal' })
    await expect(header.getByText('Criadores')).toBeVisible()
    await expect(header.getByRole('link', { name: /Criadores/ })).toHaveCount(0)
    await expect(header.getByRole('button', { name: /Criadores/ })).toHaveCount(0)
    await expect(header.getByText('Em breve')).toBeVisible()

    const footer = page.getByRole('contentinfo')
    const help = footer.getByRole('navigation', { name: 'Central de ajuda' })
    await expect(help.getByRole('link')).toHaveCount(0)
    await expect(help.getByRole('button')).toHaveCount(0)
    await expect(help.getByText(', em breve')).toHaveCount(5)
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)
  })
})
