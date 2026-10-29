import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import lighthousePackage from 'lighthouse/package.json' with { type: 'json' }

const PORT = 4173
const DEBUGGING_PORT = 9333
const BASE_URL = `http://localhost:${PORT}`
const RUNS_PER_PAGE = 3
const OUTPUT_DIR = path.resolve('lighthouse')
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const TARGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }
const METRICS = {
  lcp: 'largest-contentful-paint',
  cls: 'cumulative-layout-shift',
  tbt: 'total-blocking-time',
  fcp: 'first-contentful-paint',
  si: 'speed-index',
}

const PAGES = [
  { slug: 'inicio', path: '/' },
  { slug: 'detalhe', path: '/nfts/emerald-ape-042' },
]

const PROFILES = [
  { name: 'mobile', config: undefined },
  { name: 'desktop', config: desktopConfig },
]

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

function startPreviewServer() {
  const viteBin = path.resolve('node_modules/vite/bin/vite.js')
  return spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
  })
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(BASE_URL)
      if (response.ok) {
        return
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  throw new Error(
    `O preview não respondeu em ${BASE_URL}. Rode "npm run build" antes da auditoria.`,
  )
}

async function auditOnce(url, profile) {
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${DEBUGGING_PORT}`] })
  try {
    const result = await lighthouse(
      url,
      {
        port: DEBUGGING_PORT,
        output: ['html', 'json'],
        logLevel: 'error',
        onlyCategories: CATEGORIES,
      },
      profile.config,
    )
    if (!result) {
      throw new Error(`O Lighthouse não retornou resultado para ${url}`)
    }
    return { lhr: result.lhr, reports: result.report, browserVersion: browser.version() }
  } finally {
    await browser.close()
  }
}

function summarizeRuns(lhrs) {
  const categories = Object.fromEntries(
    CATEGORIES.map((id) => [
      id,
      median(lhrs.map((lhr) => Math.round(lhr.categories[id].score * 100))),
    ]),
  )
  const metrics = Object.fromEntries(
    Object.entries(METRICS).map(([key, auditId]) => [
      key,
      median(lhrs.map((lhr) => lhr.audits[auditId].numericValue)),
    ]),
  )
  return { categories, metrics }
}

function formatMetric(key, value) {
  return key === 'cls' ? value.toFixed(3) : `${Math.round(value)} ms`
}

function toMarkdown(summary) {
  const lines = [
    '# Auditoria Lighthouse',
    '',
    `Executada em ${summary.environment.date} com o cenário padrão dos mocks, sobre o build de produção servido por \`vite preview\`.`,
    `Mediana de ${RUNS_PER_PAGE} medições por página e perfil, cada uma em um navegador com perfil limpo.`,
    '',
    '| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP | Speed Index |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const row of summary.results) {
    const scores = CATEGORIES.map((id) => {
      const score = row.median.categories[id]
      return score >= TARGETS[id] ? `${score}` : `**${score}** (meta ${TARGETS[id]})`
    })
    const metrics = Object.keys(METRICS).map((key) => formatMetric(key, row.median.metrics[key]))
    lines.push(`| ${row.profile} | ${row.page} | ${scores.join(' | ')} | ${metrics.join(' | ')} |`)
  }
  lines.push(
    '',
    '## Ambiente',
    '',
    `- Lighthouse ${summary.environment.lighthouse}`,
    `- Navegador: ${summary.environment.browser}`,
    `- Node.js ${summary.environment.node}`,
    `- Sistema: ${summary.environment.os}`,
    `- CPU: ${summary.environment.cpu}`,
    '',
    '## Condições',
    '',
    '- Mobile: configuração padrão do Lighthouse (emulação Moto G Power, 4G lenta simulada, CPU 4x mais lenta).',
    '- Desktop: configuração desktop oficial do Lighthouse (1350x940, rede de 10 Mbps simulada, sem desaceleração de CPU).',
    '- Relatórios HTML e JSON de cada medição em `lighthouse/reports/<perfil>/`.',
  )
  return `${lines.join('\n')}\n`
}

async function main() {
  await rm(path.join(OUTPUT_DIR, 'reports'), { recursive: true, force: true })
  const server = startPreviewServer()
  try {
    await waitForServer()
    const results = []
    let browserVersion = ''

    for (const profile of PROFILES) {
      const profileDir = path.join(OUTPUT_DIR, 'reports', profile.name)
      await mkdir(profileDir, { recursive: true })

      for (const page of PAGES) {
        const lhrs = []
        for (let run = 1; run <= RUNS_PER_PAGE; run += 1) {
          console.log(`[${profile.name}] ${page.path} — medição ${run} de ${RUNS_PER_PAGE}`)
          const {
            lhr,
            reports,
            browserVersion: version,
          } = await auditOnce(`${BASE_URL}${page.path}`, profile)
          browserVersion = version
          lhrs.push(lhr)
          const [html, json] = reports
          const baseName = path.join(profileDir, `${page.slug}-medicao-${run}`)
          await writeFile(`${baseName}.report.html`, html)
          await writeFile(`${baseName}.report.json`, json)
        }
        results.push({ profile: profile.name, page: page.path, median: summarizeRuns(lhrs) })
      }
    }

    const summary = {
      environment: {
        date: new Date().toISOString(),
        lighthouse: lighthousePackage.version,
        browser: `Chromium ${browserVersion} (Playwright, headless)`,
        node: process.version,
        os: `${os.type()} ${os.release()} ${os.arch()}`,
        cpu: `${os.cpus()[0]?.model ?? 'desconhecida'} (${os.cpus().length} núcleos)`,
      },
      targets: TARGETS,
      results,
    }
    await writeFile(path.join(OUTPUT_DIR, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
    await writeFile(path.join(OUTPUT_DIR, 'summary.md'), toMarkdown(summary))
    console.log(toMarkdown(summary))
  } finally {
    server.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
