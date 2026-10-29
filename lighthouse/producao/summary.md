# Auditoria Lighthouse

Executada em 2026-10-29T03:46:28.682Z com o cenário padrão dos mocks, sobre o build de produção publicado em https://kurio-nikolas.vercel.app.
Mediana de 3 medições por página e perfil, cada uma em um navegador com perfil limpo.

| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mobile | / | 94 | 100 | 100 | 100 | 3080 ms | 0.000 | 67 ms | 1080 ms | 1601 ms |
| mobile | /nfts/emerald-ape-042 | 95 | 100 | 100 | 100 | 2968 ms | 0.000 | 54 ms | 1075 ms | 1532 ms |
| desktop | / | 100 | 100 | 100 | 100 | 624 ms | 0.005 | 0 ms | 269 ms | 498 ms |
| desktop | /nfts/emerald-ape-042 | 100 | 100 | 100 | 100 | 586 ms | 0.000 | 0 ms | 262 ms | 380 ms |

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
