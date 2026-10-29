# Auditoria Lighthouse

Executada em 2026-10-29T00:24:53.015Z com o cenário padrão dos mocks, sobre o build de produção servido por `vite preview`.
Mediana de 3 medições por página e perfil, cada uma em um navegador com perfil limpo.

| Perfil | Página | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | FCP | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| mobile | / | **84** (meta 90) | 100 | 100 | 100 | 4251 ms | 0.000 | 117 ms | 1751 ms | 1785 ms |
| mobile | /nfts/emerald-ape-042 | **84** (meta 90) | 100 | 100 | 100 | 4247 ms | 0.000 | 102 ms | 1827 ms | 1827 ms |
| desktop | / | 99 | 100 | 100 | 100 | 908 ms | 0.005 | 0 ms | 560 ms | 561 ms |
| desktop | /nfts/emerald-ape-042 | 99 | 100 | 100 | 100 | 914 ms | 0.000 | 0 ms | 542 ms | 564 ms |

## Ambiente

- Lighthouse 12.6.1
- Navegador: Chromium 156.0.8078.4 (Playwright, headless)
- Node.js v24.19.0
- Sistema: Windows_NT 10.0.26200 x64
- CPU: AMD Ryzen 5 5600GT with Radeon Graphics         (12 núcleos)

## Condições

- Mobile: configuração padrão do Lighthouse (emulação Moto G Power, 4G lenta simulada, CPU 4x mais lenta).
- Desktop: configuração desktop oficial do Lighthouse (1350x940, rede de 10 Mbps simulada, sem desaceleração de CPU).
- Relatórios HTML e JSON de cada medição em `lighthouse/reports/<perfil>/`.
