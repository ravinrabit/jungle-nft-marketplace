const BASE_URL = 'http://localhost:4173'

const AUDITED_PATHS = ['/', '/nfts/emerald-ape-042']

const formFactor = process.env.LHCI_FORM_FACTOR === 'desktop' ? 'desktop' : 'mobile'

const desktopSettings = {
  formFactor: 'desktop',
  screenEmulation: {
    mobile: false,
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    disabled: false,
  },
  throttlingMethod: 'simulate',
  throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
}

const mobileSettings = {
  formFactor: 'mobile',
  throttlingMethod: 'simulate',
}

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local',
      url: AUDITED_PATHS.map((path) => `${BASE_URL}${path}`),
      numberOfRuns: 3,
      settings: {
        ...(formFactor === 'desktop' ? desktopSettings : mobileSettings),
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: `./lighthouse/reports/${formFactor}`,
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
  },
}
