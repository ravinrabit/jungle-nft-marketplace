# Kurio — Marketplace de NFTs

Implementação do desafio frontend da Jungle Gaming: um marketplace de NFTs com catálogo, detalhe, carrinho, pagamento com carteira, confirmação de pedido, conta do colecionador e atualizações em tempo real, seguindo o layout do Figma em desktop e mobile.

Toda a API REST e o servidor Socket.IO são simulados no navegador com MSW. A aplicação roda a partir de um checkout limpo, sem backend e sem serviços externos.

- **Arquitetura, contratos e decisões:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Aplicação publicada:** https://kurio-nikolas.vercel.app
- **Auditoria Lighthouse:** [lighthouse/producao/summary.md](./lighthouse/producao/summary.md)

## Stack

| Responsabilidade              | Tecnologia                                                  |
| ----------------------------- | ----------------------------------------------------------- |
| Interface                     | React 19 + TypeScript 6 (modo estrito)                      |
| Roteamento                    | TanStack Router (rotas por arquivo, estado de busca na URL) |
| Estado remoto                 | TanStack Query                                              |
| Cliente HTTP                  | Axios, com validação Zod de todas as respostas              |
| Tempo real                    | Socket.IO (`socket.io-client`)                              |
| Estilização                   | Tailwind CSS 4 + shadcn/ui (Radix)                          |
| Mocking                       | MSW 2 + `@mswjs/socket.io-binding`                          |
| Testes E2E e regressão visual | Playwright                                                  |
| Auditoria                     | Lighthouse                                                  |
| Build                         | Vite 8                                                      |

## Requisitos

- Node.js 20.19 ou superior (desenvolvido com Node 24)
- npm 10 ou superior

## Como rodar

```bash
npm ci
npm run dev
```

Acesse `http://localhost:5173`. Os mocks iniciam automaticamente, com um banco simulado persistido no `localStorage` do navegador.

### Comandos

| Comando                           | O que faz                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                     | Servidor de desenvolvimento com mocks                                          |
| `npm run build`                   | Verificação de tipos e build de produção em `dist/`                            |
| `npm run preview`                 | Serve o build de produção em `http://localhost:4173`                           |
| `npm run typecheck`               | Verificação de tipos                                                           |
| `npm run lint`                    | ESLint (inclui jsx-a11y e regras com tipos)                                    |
| `npm run format:check`            | Verifica a formatação com Prettier                                             |
| `npm run test:e2e`                | Build, preview e suíte Playwright em desktop e mobile                          |
| `npm run test:e2e:report`         | Abre o relatório HTML da última execução                                       |
| `npm run test:e2e:update`         | Regenera as baselines de regressão visual                                      |
| `npm run lighthouse`              | Build e auditoria Lighthouse do preview local (3 medições por página e perfil) |
| `npm run lighthouse:url -- <url>` | Mesma auditoria contra uma URL publicada                                       |
| `npm run images`                  | Regera as imagens otimizadas a partir de `assets/nfts`                         |

### Variáveis de ambiente

Todas são opcionais. Os valores padrão já funcionam localmente e no deploy. Veja `.env.example`.

| Variável              | Padrão           | Descrição                                                        |
| --------------------- | ---------------- | ---------------------------------------------------------------- |
| `VITE_API_MOCKING`    | `enabled`        | `disabled` remove o MSW do bundle para apontar para uma API real |
| `VITE_API_BASE_URL`   | `/api`           | Prefixo das rotas REST                                           |
| `VITE_API_TIMEOUT_MS` | `8000`           | Tempo limite das requisições HTTP                                |
| `VITE_SOCKET_URL`     | origem da página | Endereço do servidor Socket.IO                                   |

## Credenciais fictícias

| Conta        | E-mail                    | Senha           | Observação                                 |
| ------------ | ------------------------- | --------------- | ------------------------------------------ |
| Colecionador | `colecionador@kurio.test` | `Kurio2026!`    | Duas carteiras salvas (Ethereum e Polygon) |
| Curadora     | `curadora@kurio.test`     | `Curadora2026!` | Uma carteira salva                         |

Também é possível criar uma conta pelo cadastro. Para cadastrar uma carteira, qualquer endereço no formato válido serve, por exemplo `0x1234567890abcdef1234567890abcdef12345678` na rede Ethereum.

Cupons: `KURIO10` (10%), `GENESIS` (0.05 ETH) e `EXPIRADO` (expirado, para testar o erro).

## Cenários dos mocks

O cenário é escolhido pela URL e fica salvo no navegador até ser trocado:

```text
http://localhost:5173/?mock-scenario=slow
```

Para apagar o banco simulado e voltar aos dados iniciais, use `?mock-reset`. Os dois parâmetros podem ser combinados: `?mock-scenario=default&mock-reset`.

| Cenário                 | Comportamento                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `default`               | Latência curta e determinística (120–420 ms)                                                |
| `instant`               | Sem latência (usado na regressão visual)                                                    |
| `slow`                  | 2,5 s por resposta, para ver os skeletons                                                   |
| `variable-latency`      | Latência entre 200 ms e 2,2 s                                                               |
| `out-of-order`          | Respostas alternadas lentas e rápidas, chegando fora de ordem                               |
| `empty-catalog`         | Catálogo vazio                                                                              |
| `offline`               | Toda requisição falha como sem rede                                                         |
| `server-error`          | Toda requisição responde 503                                                                |
| `flaky`                 | Uma a cada três requisições responde 503                                                    |
| `timeout`               | O servidor nunca responde                                                                   |
| `short-session`         | Sessões novas expiram em 45 s                                                               |
| `favorites-error`       | Favoritar falha, para ver a reversão otimista                                               |
| `wallet-rejected`       | A carteira recusa a conexão no pagamento                                                    |
| `payment-declined`      | O pedido é criado e depois recusado                                                         |
| `order-timeout`         | A primeira resposta da criação do pedido se perde; a nova tentativa recupera o mesmo pedido |
| `price-change-checkout` | O preço do primeiro item sobe logo depois de conectar a carteira                            |
| `realtime-chaos`        | Eventos duplicados, versões antigas e queda da conexão a cada 20 s                          |
| `realtime-offline`      | O servidor Socket.IO recusa conexões                                                        |

### Controles no console

Com a aplicação aberta, o objeto `window.__kurioMocks` permite disparar eventos do servidor simulado. Todos os eventos de tempo real passam pelo cliente Socket.IO, como em um backend real.

```js
__kurioMocks.setEditionPrice('emerald-ape-042', '1-50', '2.5')
__kurioMocks.setEditionAvailability('emerald-ape-042', '1-50', 0)
__kurioMocks.disconnectRealtime()
__kurioMocks.disconnectWallets()
__kurioMocks.expireSessions()
__kurioMocks.setScenario('payment-declined')
await __kurioMocks.reset()
```

## Como reproduzir os fluxos de falha

| Fluxo                                   | Como reproduzir                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skeletons e carregamento lento          | Abra `/?mock-scenario=slow`                                                                                                                             |
| Falha e nova tentativa                  | Abra `/?mock-scenario=server-error`; depois troque para `default` no console e clique em "Tentar novamente"                                             |
| Respostas fora de ordem                 | Abra `/?mock-scenario=out-of-order` e troque filtros rapidamente: a tela sempre mostra o último filtro                                                  |
| Expiração de sessão                     | Entre na conta e rode `__kurioMocks.expireSessions()`; a próxima ação pede login e volta para onde você estava                                          |
| Falha ao favoritar                      | Abra `?mock-scenario=favorites-error`, entre e favorite um NFT: a marcação volta e aparece o erro                                                       |
| Cupom inválido ou expirado              | No carrinho, aplique `INVALIDO` ou `EXPIRADO`                                                                                                           |
| Carteira recusa a conexão               | Abra `?mock-scenario=wallet-rejected` e clique em "Confirmar compra"                                                                                    |
| Pagamento recusado                      | Abra `?mock-scenario=payment-declined` e conclua uma compra                                                                                             |
| Timeout com recuperação do mesmo pedido | Abra `?mock-scenario=order-timeout` e conclua uma compra: após ~8 s o cliente repete a requisição com a mesma `Idempotency-Key` e recebe o mesmo pedido |
| Preço muda durante o checkout           | Abra `?mock-scenario=price-change-checkout`, abra a revisão e espere 2 s antes de assinar                                                               |
| Item esgota durante o checkout          | No pagamento, rode `__kurioMocks.setEditionAvailability('<id>', '1-50', 0)`                                                                             |
| Queda e reconexão do tempo real         | Rode `__kurioMocks.disconnectRealtime()` e, enquanto reconecta, altere um preço: ao voltar, o cliente reconcilia os dados                               |
| Eventos duplicados ou antigos           | Abra `?mock-scenario=realtime-chaos` no detalhe de um NFT e altere o preço algumas vezes                                                                |
| Carteira desconectada antes de assinar  | Abra a revisão do pagamento e rode `__kurioMocks.disconnectWallets()` antes de assinar                                                                  |

## Testes

```bash
npx playwright install chromium
npm run test:e2e
```

São 53 testes, executados no Chromium em dois projetos (desktop 1440×900 e mobile 390×844): 106 execuções, das quais 10 são puladas por cobrirem elementos que só existem em um dos dois layouts. Cada teste parte de um contexto de navegador novo, com o banco simulado zerado. O cenário instantâneo deixa os tempos determinísticos, e o relógio é controlado com `page.clock` nos testes sensíveis a tempo.

| Arquivo                   | Cobertura                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `catalog.spec.ts`         | Busca, filtros combinados, ordenação, paginação, histórico, respostas fora de ordem, skeletons, estado vazio, falha e nova tentativa |
| `nft-detail.spec.ts`      | Acesso direto, NFT inexistente, edição esgotada e limite de quantidade                                                               |
| `auth.spec.ts`            | Cadastro, conflito, login, retorno ao fluxo, redirecionamento seguro, expiração pelo relógio, logout e troca de usuário              |
| `favorites.spec.ts`       | Persistência e reversão da atualização otimista                                                                                      |
| `cart.spec.ts`            | Quantidades, remoção, cupons, persistência após recarregar e mescla do carrinho de visitante                                         |
| `checkout.spec.ts`        | Compra completa até o recibo, pagamento recusado, clique repetido e timeout com a mesma chave de idempotência                        |
| `account.spec.ts`         | Perfil, avatar, senha e carteiras, com erros de validação                                                                            |
| `realtime.spec.ts`        | Preço e estoque via Socket.IO no checkout, duplicatas e versões antigas, reconexão e retomada do pedido pendente                     |
| `accessibility.spec.ts`   | Navegação por teclado, foco de diálogos e validação acessível                                                                        |
| `responsive.spec.ts`      | Layout desktop sem barra inferior e sem overflow em 900, 960 e 1024 px                                                               |
| `secondary-flows.spec.ts` | Lista de interesse, recuperação de senha, newsletter e itens "Em breve"                                                              |
| `visual.spec.ts`          | Regressão visual de início, detalhe, carrinho e pagamento                                                                            |

O relatório HTML fica em `playwright-report/` (`npm run test:e2e:report`). Em caso de falha, ficam salvos trace, vídeo e captura em `test-results/`.

As baselines visuais estão versionadas em `tests/e2e/__screenshots__/` e foram geradas no Windows. A renderização de fontes varia entre sistemas operacionais: em outro ambiente (por exemplo, Linux numa CI), gere baselines próprias com `npm run test:e2e:update`.

## Auditoria Lighthouse

```bash
npm run lighthouse:url -- https://kurio-nikolas.vercel.app
```

O script `scripts/lighthouse-audit.mjs` roda o Lighthouse 12.6.1 três vezes por página (início e detalhe) e por perfil (mobile e desktop), cada vez num navegador com perfil limpo e com o cenário padrão dos mocks. Sem URL (`npm run lighthouse`), ele gera o build e audita o preview local. As medianas, o ambiente e as condições ficam em `lighthouse/<alvo>/summary.md`, e os relatórios HTML e JSON de cada medição em `lighthouse/<alvo>/reports/`.

Resultado oficial, medido no build de produção publicado na Vercel ([lighthouse/producao](./lighthouse/producao/summary.md)):

| Perfil  | Página  | Performance | Accessibility | Best Practices | SEO | LCP   | CLS   | TBT   |
| ------- | ------- | ----------- | ------------- | -------------- | --- | ----- | ----- | ----- |
| mobile  | início  | 94          | 100           | 100            | 100 | 3,1 s | 0     | 67 ms |
| mobile  | detalhe | 95          | 100           | 100            | 100 | 3,0 s | 0     | 54 ms |
| desktop | início  | 100         | 100           | 100            | 100 | 0,6 s | 0,005 | 0 ms  |
| desktop | detalhe | 100         | 100           | 100            | 100 | 0,6 s | 0     | 0 ms  |

Todas as metas do enunciado são atingidas. No preview local ([lighthouse/local](./lighthouse/local/summary.md)), a performance mobile fica em 84; a diferença e as otimizações aplicadas estão em [ARCHITECTURE.md](./ARCHITECTURE.md#performance-e-lighthouse).

## Deploy

O projeto está configurado para a Vercel em `vercel.json`: comando de build, pasta `dist`, reescrita das rotas para a SPA (acesso direto e refresh), cabeçalhos de segurança com CSP e cache dos assets. Não há variáveis de ambiente obrigatórias.

## Estrutura

```text
src/
  app/          rotas (TanStack Router), layout e inicialização
  features/     funcionalidades por domínio (catálogo, detalhe, autenticação, conta, carrinho, pagamento, tempo real)
  shared/       contratos da API, cliente HTTP, componentes de UI e utilitários
  mocks/        banco simulado, regras de negócio, handlers REST, servidor Socket.IO e cenários
tests/e2e/      suíte Playwright e baselines visuais
scripts/        otimização de imagens e auditoria Lighthouse
lighthouse/     resultados da auditoria (produção e preview local)
```
