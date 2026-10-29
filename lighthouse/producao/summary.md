# Auditoria Lighthouse

Executada em 2026-10-29T03:07:55.248Z com o cenário padrão dos mocks, sobre o build de produção publicado em https://kurio-nikolas.vercel.app.
Mediana de 3 medições por página e perfil, cada uma em um navegador com perfil limpo.

| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mobile | / | 93 | 100 | 96 | 100 | 3135 ms | 0.000 | 110 ms | 1084 ms | 1807 ms |
| mobile | /nfts/emerald-ape-042 | 94 | 100 | 96 | 100 | 2980 ms | 0.000 | 112 ms | 1082 ms | 1464 ms |
| desktop | / | 100 | 100 | 96 | 100 | 640 ms | 0.005 | 0 ms | 275 ms | 532 ms |
| desktop | /nfts/emerald-ape-042 | 100 | 100 | 96 | 100 | 596 ms | 0.000 | 0 ms | 267 ms | 459 ms |

## Ambiente

- Lighthouse 12.6.1
- Navegador: Chromium 156.0.8078.4 (Playwright, headless)
- Node.js v24.19.0
- Sistema: Windows_NT 10.0.26200 x64
- CPU: AMD Ryzen 5 5600GT with Radeon Graphics         (12 núcleos)

## Condições

- Mobile: configuração padrão do Lighthouse (emulação Moto G Power, 4G lenta simulada, CPU 4x mais lenta).
- Desktop: configuração desktop oficial do Lighthouse (1350x940, rede de 10 Mbps simulada, sem desaceleração de CPU).
- Relatórios HTML e JSON de cada medição em `lighthouse/producao/reports/<perfil>/`.
