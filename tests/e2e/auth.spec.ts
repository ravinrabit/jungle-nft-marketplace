import { expect, test } from './support/fixtures'
import { ACCOUNTS, NFTS } from './support/test-data'

const SESSION_TTL = '30:01'

test.describe('Cadastro', () => {
  test('valida os campos, trata conflito e cria a conta', async ({ app }) => {
    await app.open('/?auth=cadastro')
    const dialog = app.authDialog
    const form = dialog.locator('form')
    const submit = form.getByRole('button', { name: /Criar (conta|perfil)/ })

    await submit.click()
    await expect(form.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByLabel('Nome de usuário')).toBeFocused()

    await form.getByLabel('Nome de usuário').fill('colecionador')
    await form.getByLabel('Digite seu e-mail').fill(ACCOUNTS.collector.email)
    await form.getByLabel('Senha', { exact: true }).fill('Segura2026!')
    await form.getByLabel('Confirmar senha').fill('Outra2026!')
    await submit.click()
    await expect(form.getByText('As senhas não coincidem')).toBeVisible()

    await form.getByLabel('Confirmar senha').fill('Segura2026!')
    await submit.click()
    await expect(form.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(form.getByLabel('Digite seu e-mail')).toHaveAttribute('aria-invalid', 'true')

    await form.getByLabel('Nome de usuário').fill('nova_colecionadora')
    await form.getByLabel('Digite seu e-mail').fill('nova@kurio.test')
    await submit.click()
    await expect(dialog).toBeHidden()
    await expect(app.toast('Conta criada com sucesso.')).toBeVisible()
    await expect(app.accountTrigger({ displayName: 'nova_colecionadora' })).toBeVisible()
  })
})

test.describe('Login e sessão', () => {
  test('recusa credenciais inválidas e volta ao fluxo anterior após entrar', async ({
    app,
    page,
  }) => {
    await app.open('/perfil')
    await expect(app.authDialog).toBeVisible()
    await expect(page).toHaveURL(/redirect=%2Fperfil/)

    await app.submitSignIn({ email: ACCOUNTS.collector.email, password: 'senha-errada1' })
    await expect(app.authDialog.getByRole('alert')).toHaveText(/E-mail ou senha incorretos/)

    await app.submitSignIn(ACCOUNTS.collector)
    await expect(page).toHaveURL('/perfil')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  })

  test('ignora redirecionamento para outro site após o login', async ({ app, page }) => {
    await app.open('/?auth=entrar&redirect=%2F%09%2Fevil.example')
    await app.submitSignIn(ACCOUNTS.collector)
    await expect(app.toast('Login realizado com sucesso.')).toBeVisible()
    await expect(page).toHaveURL('/')
  })

  test('expira a sessão pelo relógio e retoma a rota privada após novo login', async ({
    app,
    page,
  }) => {
    await page.clock.install()
    await app.open('/')
    await app.signIn()
    await page.goto('/perfil')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()

    await page.clock.fastForward(SESSION_TTL)
    await expect(app.toast(/Sua sessão expirou/)).toBeVisible()
    await expect(app.authDialog).toBeVisible()
    await expect(page).toHaveURL(/redirect=%2Fperfil/)

    await app.submitSignIn(ACCOUNTS.collector)
    await expect(page).toHaveURL('/perfil')
  })

  test('sai da conta e bloqueia a rota privada', async ({ app, page }) => {
    await app.open('/')
    await app.signIn()
    await page.goto('/perfil')
    await app.signOut()
    await expect(page).toHaveURL('/')
    await page.goto('/perfil')
    await expect(app.authDialog).toBeVisible()
  })

  test('troca de usuário não expõe dados da conta anterior', async ({ app, page }) => {
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`)
    await app.signIn(ACCOUNTS.collector)
    const favorite = app.visible(page.getByRole('button', { name: /^Favorit/ }))
    await favorite.click()
    await expect(favorite).toHaveAttribute('aria-pressed', 'true')
    await app.buyButton().click()
    await page.waitForURL(/\/carrinho/)
    await expect(app.checkoutButton()).toBeVisible()

    await app.signOut(ACCOUNTS.collector)
    await app.open(`/nfts/${NFTS.emeraldApe.slug}`)
    await app.signIn(ACCOUNTS.curator)
    await expect(app.visible(page.getByRole('button', { name: /^Favorit/ }))).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })
})
