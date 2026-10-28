import { test as base, expect, type Locator, type Page } from '@playwright/test'
import {
  ACCOUNTS,
  type EditionKind,
  type MockControls,
  type MockScenarioId,
  type TestAccount,
} from './test-data'

const SCENARIO_PARAM = 'mock-scenario'

interface OpenOptions {
  scenario?: MockScenarioId
}

export class KurioApp {
  constructor(
    readonly page: Page,
    readonly isMobile: boolean,
  ) {}

  async open(path = '/', { scenario = 'instant' }: OpenOptions = {}) {
    const url = new URL(path, 'http://kurio.local')
    url.searchParams.set(SCENARIO_PARAM, scenario)
    await this.page.goto(`${url.pathname}${url.search}${url.hash}`)
    await this.waitForMocks()
  }

  async reload() {
    await this.page.reload()
    await this.waitForMocks()
  }

  async waitForMocks() {
    await this.page.waitForFunction(() => window.__kurioMocks !== undefined)
    await this.page.locator('main#conteudo').waitFor({ state: 'attached' })
  }

  async control<TName extends keyof MockControls>(
    name: TName,
    ...args: Parameters<MockControls[TName]>
  ) {
    await this.page.evaluate(
      ([controlName, controlArgs]) => {
        const controls = window.__kurioMocks
        if (!controls) {
          throw new Error('Controles do mock indisponíveis')
        }
        const run = controls[controlName] as (...values: unknown[]) => unknown
        return run(...controlArgs)
      },
      [name, args] as const,
    )
  }

  setScenario(scenario: MockScenarioId) {
    return this.control('setScenario', scenario)
  }

  setEditionPrice(nftId: string, editionKind: EditionKind, price: string) {
    return this.control('setEditionPrice', nftId, editionKind, price)
  }

  setEditionAvailability(nftId: string, editionKind: EditionKind, available: number) {
    return this.control('setEditionAvailability', nftId, editionKind, available)
  }

  get authDialog() {
    return this.page.getByRole('dialog').filter({ has: this.page.locator('form') })
  }

  toast(text: string | RegExp) {
    return this.page.locator('[data-sonner-toaster]').getByText(text)
  }

  visible(locator: Locator) {
    return locator.filter({ visible: true }).first()
  }

  async openSignIn() {
    const trigger = this.isMobile
      ? this.page.getByRole('button', { name: 'Entrar na conta' })
      : this.page.getByRole('banner').getByRole('button', { name: 'Entrar' })
    if (await trigger.filter({ visible: true }).count()) {
      await this.visible(trigger).click()
    } else {
      const url = new URL(this.page.url())
      url.searchParams.set('auth', 'entrar')
      await this.page.goto(`${url.pathname}${url.search}`)
      await this.waitForMocks()
    }
    await expect(this.authDialog).toBeVisible()
  }

  async submitSignIn(account: Pick<TestAccount, 'email' | 'password'>) {
    const dialog = this.authDialog
    await dialog.getByLabel('E-mail').fill(account.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(account.password)
    await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
  }

  async signIn(account: TestAccount = ACCOUNTS.collector) {
    await this.openSignIn()
    await this.submitSignIn(account)
    await expect(this.authDialog).toBeHidden()
    await expect(this.toast('Login realizado com sucesso.')).toBeVisible()
  }

  accountTrigger(account: Pick<TestAccount, 'displayName'>) {
    const name = this.isMobile
      ? `Conta de ${account.displayName}`
      : `Menu da conta de ${account.displayName}`
    return this.visible(this.page.getByRole('button', { name }))
  }

  async signOut(account: Pick<TestAccount, 'displayName'> = ACCOUNTS.collector) {
    if (!(await this.accountTrigger(account).count())) {
      await this.page.goto('/')
      await this.waitForMocks()
    }
    await this.accountTrigger(account).click()
    const exit = this.isMobile
      ? this.page.getByRole('dialog').getByRole('button', { name: 'Sair' })
      : this.page.getByRole('menuitem', { name: 'Sair' })
    await exit.click()
    await expect(this.toast('Você saiu da sua conta.')).toBeVisible()
  }

  buyButton() {
    return this.visible(this.page.getByRole('button', { name: /^Comprar( NFT)?$/ }))
  }

  async addToCartAndOpenCart(slug: string) {
    await this.page.goto(`/nfts/${slug}`)
    await this.buyButton().click()
    await this.page.waitForURL(/\/carrinho/)
    await expect(this.checkoutButton()).toBeVisible()
  }

  checkoutButton() {
    return this.visible(this.page.getByRole('button', { name: 'Conectar e finalizar' }))
  }

  confirmPurchaseButton() {
    return this.page.getByRole('button', { name: 'Confirmar compra' })
  }

  reviewDialog() {
    return this.page.getByRole('dialog', { name: 'Revise e assine a compra' })
  }

  async openReview() {
    await this.confirmPurchaseButton().click()
    await expect(this.reviewDialog()).toBeVisible()
    return this.reviewDialog()
  }

  receipt() {
    return this.page.getByRole('dialog', { name: 'Seus NFTs agora estão na sua carteira' })
  }

  async horizontalOverflow() {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
  }
}

export const test = base.extend<{ app: KurioApp }>({
  app: async ({ page, isMobile }, use) => {
    await use(new KurioApp(page, isMobile))
  },
})

export { expect }
