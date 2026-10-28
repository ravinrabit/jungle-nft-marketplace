import { expect, test } from './support/fixtures'
import { ACCOUNTS } from './support/test-data'

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('Perfil do colecionador', () => {
  test.beforeEach(async ({ app, page }) => {
    await app.open('/')
    await app.signIn()
    await page.goto('/perfil')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  })

  test('valida e salva os dados do perfil', async ({ app, page }) => {
    const displayName = page.getByLabel(/^Nome de exibição/)
    await displayName.fill('C')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Informe pelo menos 2 caracteres').first()).toBeVisible()
    await expect(displayName).toHaveAttribute('aria-invalid', 'true')

    await displayName.fill('Colecionadora Atualizada')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(app.toast('Perfil atualizado.')).toBeVisible()

    await app.reload()
    await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue('Colecionadora Atualizada')
  })

  test('envia, rejeita e remove o avatar', async ({ app, page }) => {
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles({
      name: 'notas.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('x'),
    })
    await expect(app.toast('Envie uma imagem PNG, JPG ou WebP.')).toBeVisible()

    await fileInput.setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: ONE_PIXEL_PNG,
    })
    await expect(app.toast('Avatar atualizado.')).toBeVisible()
    await expect(
      page.getByRole('img', { name: `Avatar de ${ACCOUNTS.collector.displayName}` }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Remover', exact: true }).click()
    await expect(app.toast('Avatar removido.')).toBeVisible()
    await expect(
      page.getByRole('img', { name: `Avatar de ${ACCOUNTS.collector.displayName}` }),
    ).toHaveCount(0)
  })

  test('recusa a senha atual incorreta e troca a senha', async ({ app, page }) => {
    const newPassword = 'NovaSenha2026'
    await page.getByLabel(/^Senha atual/).fill('errada123')
    await page.getByLabel(/^Nova senha/).fill(newPassword)
    await page.getByLabel(/^Confirmar nova senha/).fill(newPassword)
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('A senha atual está incorreta.').first()).toBeVisible()
    await expect(page.getByLabel(/^Senha atual/)).toHaveAttribute('aria-invalid', 'true')

    await page.getByLabel(/^Senha atual/).fill(ACCOUNTS.collector.password)
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(app.toast('Perfil e senha atualizados.')).toBeVisible()

    await app.signOut()
    await app.signIn({ ...ACCOUNTS.collector, password: newPassword })
  })
})

test.describe('Carteiras', () => {
  test('valida o endereço e salva as carteiras principal e secundária', async ({ app, page }) => {
    await app.open('/')
    await app.signIn(ACCOUNTS.curator)
    await page.goto('/perfil/carteiras')

    const primary = page.getByRole('form', { name: 'Carteira principal' })
    const address = primary.getByLabel(/^Endereço da carteira/)
    await address.fill('0x123')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(
      primary.getByText('Informe um endereço 0x com 40 caracteres hexadecimais'),
    ).toBeVisible()
    await expect(address).toHaveAttribute('aria-invalid', 'true')

    await address.fill('0x1111111111111111111111111111111111111111')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(app.toast('Carteira principal salva.')).toBeVisible()

    await page.getByText('Igual à carteira principal').click()
    const secondary = page.getByRole('form', { name: 'Carteira secundária' })
    await expect(secondary.getByLabel(/^Endereço da carteira/)).toHaveValue(
      '0x1111111111111111111111111111111111111111',
    )
    await secondary.getByLabel(/^Apelido da carteira/).fill('Reserva da curadoria')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(app.toast('Carteira secundária salva.')).toBeVisible()

    await app.reload()
    await expect(
      page.getByRole('form', { name: 'Carteira secundária' }).getByLabel(/^Apelido da carteira/),
    ).toHaveValue('Reserva da curadoria')
  })
})
