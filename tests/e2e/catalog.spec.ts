import type { Locator, Page } from '@playwright/test'
import { expect, test } from './support/fixtures'

const TOTAL_NFTS = 38

function results(page: Page) {
  return page.getByRole('list', { name: 'Resultados do catálogo' })
}

function announcement(page: Page) {
  return page.locator('#catalogo p.sr-only[aria-live="polite"]')
}

function toggleFilter(container: Locator, label: string) {
  return container
    .locator('label')
    .filter({ hasText: new RegExp(`^${label}`) })
    .click()
}

async function cardPrices(page: Page) {
  const texts = await results(page).getByRole('listitem').allInnerTexts()
  return texts.map((text) => Number(/(\d+\.\d+) ETH/.exec(text)?.[1]))
}

function catalogRequest(page: Page, expected: Record<string, string>) {
  return page.waitForRequest((request) => {
    const url = new URL(request.url())
    return (
      url.pathname === '/api/nfts' &&
      Object.entries(expected).every(
        ([key, value]) => url.searchParams.getAll(key).join(',') === value,
      )
    )
  })
}

test.describe('Catálogo no desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Os filtros laterais existem apenas no desktop')

  test('combina busca, filtros, ordenação e paginação na URL e restaura pelo histórico', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await expect(results(page).getByRole('listitem')).toHaveCount(9)
    await expect(announcement(page)).toHaveText(`${TOTAL_NFTS} NFTs encontrados, página 1 de 5`)

    await page.getByRole('link', { name: 'Próxima página' }).click()
    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(announcement(page)).toHaveText(/página 2 de 5/)

    const filters = page.getByRole('complementary', { name: 'Filtros do catálogo' })
    const networkRequest = catalogRequest(page, { networks: 'ethereum', page: '1' })
    await toggleFilter(filters, 'Ethereum')
    await networkRequest
    await expect(page).toHaveURL(/networks=ethereum/)
    await expect(page).not.toHaveURL(/page=/)

    const combinedRequest = catalogRequest(page, {
      networks: 'ethereum',
      categories: 'digital-art',
    })
    await toggleFilter(filters, 'Arte digital')
    await combinedRequest
    await expect(page).toHaveURL(/categories=digital-art/)
    await expect(announcement(page)).toHaveText(/NFTs? encontrados?, página 1/)

    await page.getByLabel('Ordenar por:').click()
    await page.getByRole('option', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect
      .poll(async () => {
        const prices = await cardPrices(page)
        return prices.every((price, index) => index === 0 || price >= (prices[index - 1] ?? 0))
      })
      .toBe(true)
    const filteredUrl = page.url()

    await page.getByRole('banner').getByRole('button', { name: 'Buscar NFTs' }).click()
    const searchDialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
    await searchDialog.getByLabel('Termo de busca').fill('ape')
    const searchRequest = catalogRequest(page, { q: 'ape' })
    await searchDialog.getByRole('button', { name: 'Buscar' }).click()
    await searchRequest
    await expect(page).toHaveURL(/q=ape/)
    await expect(results(page).getByRole('listitem').first()).toContainText(/ape/i)

    await page.goBack()
    await expect(page).toHaveURL(filteredUrl)
    await expect(filters.getByRole('checkbox', { name: /^Ethereum/ })).toBeChecked()
    await expect(filters.getByRole('checkbox', { name: /^Arte digital/ })).toBeChecked()
    await expect(page.getByLabel('Ordenar por:')).toHaveText('Menor preço')

    await page.goBack()
    await expect(page).not.toHaveURL(/sort=/)
    await page.goForward()
    await expect(page).toHaveURL(filteredUrl)

    await app.reload()
    await expect(filters.getByRole('checkbox', { name: /^Ethereum/ })).toBeChecked()
    await expect(page.getByLabel('Ordenar por:')).toHaveText('Menor preço')
  })

  test('ignora a resposta antiga quando as respostas chegam fora de ordem', async ({
    app,
    page,
  }) => {
    await app.open('/')
    await expect(results(page).getByRole('listitem')).toHaveCount(9)
    await app.setScenario('out-of-order')

    await page.getByRole('link', { name: 'Próxima página' }).click()
    await toggleFilter(page.getByRole('complementary', { name: 'Filtros do catálogo' }), 'Solana')

    await expect(page).toHaveURL(/networks=solana/)
    await page.waitForTimeout(2_000)
    await expect(page).not.toHaveURL(/page=2/)
    await expect(announcement(page)).toHaveText(/página 1 de/)
  })
})

test.describe('Catálogo no mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'A busca e os filtros em painel existem apenas no mobile')

  test('filtra pelo painel e busca pelo campo, mantendo a URL após recarregar', async ({
    app,
    page,
  }) => {
    await app.open('/')
    const searchField = page.getByLabel('Buscar NFTs por nome, coleção ou criador')
    await searchField.fill('nomad')
    await expect(page).toHaveURL(/q=nomad/)
    await expect(results(page).getByRole('listitem').first()).toContainText(/nomad/i)

    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    const sheet = page.getByRole('dialog', { name: 'Filtros' })
    await toggleFilter(sheet, 'Polygon')
    await expect(page).toHaveURL(/networks=polygon/)
    await expect(page).toHaveURL(/q=nomad/)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()

    await app.reload()
    await expect(page.getByLabel('Buscar NFTs por nome, coleção ou criador')).toHaveValue('nomad')
    await expect(page).toHaveURL(/networks=polygon/)
    expect(await app.horizontalOverflow()).toBe(0)
  })
})

test.describe('Estados do catálogo', () => {
  test('mostra skeletons durante o carregamento lento', async ({ app, page }) => {
    await app.open('/', { scenario: 'slow' })
    await expect(
      page.locator('#catalogo [data-slot="skeleton"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expect(results(page).getByRole('listitem').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('#catalogo [data-slot="skeleton"]')).toHaveCount(0)
  })

  test('mostra o estado vazio', async ({ app, page }) => {
    await app.open('/', { scenario: 'empty-catalog' })
    await expect(page.getByText('Nenhum NFT encontrado').first()).toBeVisible()
  })

  test('mostra a falha e recupera com nova tentativa', async ({ app, page }) => {
    await app.open('/', { scenario: 'server-error' })
    const failure = page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível carregar o catálogo' })
    await expect(failure).toBeVisible({ timeout: 15_000 })

    await app.setScenario('instant')
    await failure.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(results(page).getByRole('listitem').first()).toBeVisible()
  })
})
