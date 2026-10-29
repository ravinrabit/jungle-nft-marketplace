# Arquitetura

Este documento descreve a organização da aplicação, os contratos REST e de tempo real, a política de sessão, o estado do carrinho, a estratégia de cache, a reconciliação entre REST e Socket.IO, as decisões de UX, os desvios do Figma e as limitações conhecidas.

## Visão geral

```text
Navegador
├── React + TanStack Router ── telas e estado na URL
├── TanStack Query ─────────── cache, deduplicação e invalidação
├── Axios (http-client) ────── Bearer, timeout, erros normalizados, validação Zod
├── socket.io-client ───────── eventos nft.updated e order.updated
└── MSW (Service Worker + interceptação de WebSocket)
    ├── handlers REST ──────── regras de negócio do "backend"
    ├── servidor Socket.IO ─── publica eventos com versão
    └── banco simulado ─────── persistido no localStorage
```

O frontend não sabe que a API é simulada: ele só conhece os contratos em `src/shared/api/contracts`. Com `VITE_API_MOCKING=disabled`, o MSW sai do bundle e a mesma aplicação pode apontar para uma API real com esses contratos.

### Organização do código

| Pasta                     | Responsabilidade                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/app`                 | Inicialização, roteador, rotas por arquivo (`routes/`) e layout global (cabeçalho, rodapé, barra mobile) |
| `src/features/catalog`    | Catálogo, filtros na URL, cards, grade e carrossel                                                       |
| `src/features/nft-detail` | Detalhe, galeria, seleção de edição e quantidade                                                         |
| `src/features/auth`       | Sessão, login, cadastro, recuperação de senha, expiração e proteção de rotas                             |
| `src/features/account`    | Perfil, avatar, senha e carteiras                                                                        |
| `src/features/cart`       | Carrinho, cupom, cotação, favoritos e mescla do carrinho de visitante                                    |
| `src/features/checkout`   | Pagamento, conexão de carteira, idempotência, pedido e recibo                                            |
| `src/features/realtime`   | Cliente Socket.IO, filtro de eventos e aplicação dos eventos no cache                                    |
| `src/shared`              | Contratos Zod, cliente HTTP, erros, componentes de UI (shadcn/ui) e utilitários                          |
| `src/mocks`               | Banco simulado, regras de domínio, handlers REST, servidor Socket.IO, cenários e controles               |

Cada funcionalidade concentra sua camada de dados (`api/`), seus componentes e seus hooks. As rotas em `src/app/routes` são finas e só compõem as funcionalidades.

### Inicialização

`src/main.tsx` importa só os estilos e inicia **em paralelo** o download do ambiente simulado (`@/mocks/browser`) e do app (`@/app/start-app`). O app só renderiza depois que o Service Worker do MSW está ativo, para nenhuma requisição escapar dos mocks. Enquanto isso, o `index.html` mostra uma tela estática de carregamento. Se o navegador bloquear Service Workers, aparece uma tela de erro explicando o motivo.

## Contratos

Todos os contratos são schemas Zod em `src/shared/api/contracts`. As respostas são validadas no cliente (`requestData`); uma resposta fora do contrato vira o erro `INVALID_RESPONSE` em vez de quebrar a interface. Valores em ETH trafegam como strings decimais e são calculados com `big.js`, sem ponto flutuante.

### Erros

Formato único: `{ error: { code, message, fieldErrors?, details? }, requestId }`. O Axios converte qualquer falha em `ApiError` com um código conhecido. Erros de rede (`NETWORK_ERROR`, `TIMEOUT`, `TRANSIENT_FAILURE`, `INTERNAL_ERROR`) são considerados recuperáveis e repetidos automaticamente nas consultas.

Códigos de negócio: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `SESSION_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `AVAILABILITY_CONFLICT`, `PRICE_CHANGED`, `QUOTE_EXPIRED`, `COUPON_INVALID`, `COUPON_EXPIRED`, `IDEMPOTENCY_CONFLICT`, `PAYMENT_DECLINED`, `WALLET_REJECTED`, `WALLET_DISCONNECTED`.

### REST

Todas as rotas usam o prefixo `/api`. Rotas autenticadas exigem `Authorization: Bearer <token>`.

| Método e rota                                          | Auth           | Descrição                                                                                                                           | Erros relevantes                                                                                                                                 |
| ------------------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /nfts`                                            | —              | Catálogo paginado com facetas. Parâmetros: `q`, `categories`, `networks`, `minPrice`, `maxPrice`, `tab`, `sort`, `page`, `pageSize` | `VALIDATION_ERROR`                                                                                                                               |
| `GET /nfts/featured`                                   | —              | Destaques do hero e NFT em destaque                                                                                                 |                                                                                                                                                  |
| `GET /nfts/:id`                                        | —              | Detalhe com edições, avaliações e versão                                                                                            | `NOT_FOUND`                                                                                                                                      |
| `GET /nfts/:id/related`                                | —              | Relacionados (mesma categoria, depois popularidade)                                                                                 | `NOT_FOUND`                                                                                                                                      |
| `POST /auth/register`                                  | —              | Cria conta e sessão                                                                                                                 | `VALIDATION_ERROR`, `CONFLICT` (e-mail ou usuário em uso)                                                                                        |
| `POST /auth/login`                                     | —              | Abre sessão                                                                                                                         | `INVALID_CREDENTIALS`                                                                                                                            |
| `GET /auth/session`                                    | ✓              | Sessão atual                                                                                                                        | `SESSION_EXPIRED`                                                                                                                                |
| `POST /auth/logout`                                    | ✓              | Encerra a sessão no servidor                                                                                                        |                                                                                                                                                  |
| `POST /auth/password-reset`                            | —              | Solicita redefinição de senha; responde 202 sempre, sem revelar se a conta existe                                                   | `VALIDATION_ERROR`                                                                                                                               |
| `GET` / `PUT /me`                                      | ✓              | Perfil                                                                                                                              | `VALIDATION_ERROR`, `CONFLICT`                                                                                                                   |
| `PUT` / `DELETE /me/avatar`                            | ✓              | Avatar em data URL PNG, JPG ou WebP de até 512 KB                                                                                   | `VALIDATION_ERROR`                                                                                                                               |
| `PUT /me/password`                                     | ✓              | Troca de senha                                                                                                                      | `VALIDATION_ERROR` (senha atual incorreta)                                                                                                       |
| `GET /me/wallets`, `PUT /me/wallets/:slot`             | ✓              | Carteiras principal e secundária                                                                                                    | `VALIDATION_ERROR`                                                                                                                               |
| `GET /me/favorites`, `GET /me/favorites/items`         | ✓              | IDs favoritos e lista de NFTs favoritos                                                                                             |                                                                                                                                                  |
| `PUT` / `DELETE /me/favorites/:nftId`                  | ✓              | Favoritar e desfavoritar (idempotentes)                                                                                             | `NOT_FOUND`                                                                                                                                      |
| `GET /cart`                                            | ✓ ou visitante | Carrinho do dono                                                                                                                    |                                                                                                                                                  |
| `POST /cart/items`, `PATCH` / `DELETE /cart/items/:id` | ✓ ou visitante | Adicionar, alterar e remover, respeitando disponibilidade e limite por pedido                                                       | `AVAILABILITY_CONFLICT`, `NOT_FOUND`                                                                                                             |
| `POST /cart/merge`                                     | ✓              | Mescla o carrinho de visitante no do usuário, ajustando quantidades                                                                 |                                                                                                                                                  |
| `POST /cart/quote`                                     | ✓ ou visitante | Cotação com cupom e rede: subtotal, desconto, taxa, total, pendências e validade de 10 min                                          | `COUPON_INVALID`, `COUPON_EXPIRED`                                                                                                               |
| `POST /wallet/connections`                             | ✓              | Conecta uma carteira salva com provedor e rede                                                                                      | `WALLET_REJECTED`, `VALIDATION_ERROR` (rede incompatível), `NOT_FOUND`                                                                           |
| `DELETE /wallet/connections/:id`                       | ✓              | Desconecta                                                                                                                          | `NOT_FOUND`                                                                                                                                      |
| `POST /orders`                                         | ✓              | Cria o pedido. Exige `Idempotency-Key` (UUID)                                                                                       | `IDEMPOTENCY_CONFLICT`, `QUOTE_EXPIRED`, `PRICE_CHANGED`, `AVAILABILITY_CONFLICT`, `WALLET_DISCONNECTED`, `CONFLICT` (já existe pedido pendente) |
| `GET /orders/active`                                   | ✓              | Pedido pendente do usuário, se houver                                                                                               |                                                                                                                                                  |
| `GET /orders/:id`                                      | ✓              | Pedido do usuário                                                                                                                   | `NOT_FOUND` (inclusive para pedido de outro usuário)                                                                                             |
| `POST /newsletter/subscriptions`                       | —              | Inscrição idempotente (`subscribed` ou `already-subscribed`)                                                                        | `VALIDATION_ERROR`                                                                                                                               |

O carrinho de visitante é identificado pelo cabeçalho `X-Guest-Cart-Id` (UUID gerado no navegador). Com `Authorization`, o dono é sempre o usuário da sessão.

### Pedido e idempotência

1. O pagamento conecta a carteira (`POST /wallet/connections`) e pede uma cotação nova para a rede escolhida.
2. A revisão mostra itens, taxas, total, carteira e rede. Ao assinar, o cliente envia `POST /orders` com `{ quoteId, connectionId, collector }` e uma `Idempotency-Key`.
3. A chave é gerada uma vez por conteúdo de pedido e guardada no `sessionStorage`. Repetir o mesmo conteúdo (nova tentativa, timeout, clique repetido) reaproveita a chave; mudar o conteúdo (nova cotação, outra carteira) gera outra.
4. O servidor:
   - com a mesma chave e o mesmo conteúdo, devolve o pedido já criado (200);
   - com a mesma chave e outro conteúdo, responde `IDEMPOTENCY_CONFLICT`;
   - revalida a cotação. Se o preço mudou, se a disponibilidade caiu ou se o carrinho mudou, responde 409 com a **cotação nova** em `details.quote`, e a revisão mostra os novos valores para o usuário assinar de novo;
   - recusa um segundo pedido enquanto houver um pendente.
5. O pedido nasce `pending`. Cerca de 2,5 s depois, o servidor o confirma (`confirmed`: reduz o estoque, remove do carrinho só os itens comprados, gera o hash da transação e publica os eventos) ou o recusa (`declined`, com motivo). Se o estoque acabou nesse intervalo, o pedido é recusado.
6. Em timeout ou falha de rede, a mutation é repetida até duas vezes com a mesma chave. O botão fica desabilitado durante o envio.

Estados do pedido: `pending` → `confirmed` | `declined`.

### Tempo real

O cliente conecta via WebSocket em `VITE_SOCKET_URL` (padrão: a própria origem) e emite `session.identify` com o token da sessão, de novo a cada login ou logout. O servidor publica:

| Evento          | Público             | Conteúdo                                                                             |
| --------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `nft.updated`   | Todos               | `price`, `compareAtPrice`, `isAvailable` e `editions` (`kind`, `available`, `price`) |
| `order.updated` | Só o dono do pedido | `status`, `transactionHash`, `explorerUrl`, `declineReason`                          |

Envelope comum: `eventId`, `type`, `version`, `occurredAt` e `resource: { type, id }`. A `version` é a mesma do recurso no REST, o que permite comparar evento e cache.

## Política de sessão

- **Senhas:** guardadas no banco simulado só como hash PBKDF2 com sal (Web Crypto). Login inválido responde sempre "E-mail ou senha incorretos".
- **Token:** opaco, aleatório, de 256 bits, guardado no `localStorage` e enviado como `Bearer`. Validade de 30 min (45 s no cenário `short-session`). O logout invalida o token no servidor.
- **Expiração:** detectada de dois jeitos. Um temporizador dispara no `expiresAt`, e qualquer resposta `SESSION_EXPIRED` ou `UNAUTHENTICATED` de uma requisição autenticada também encerra a sessão. Nos dois casos, a sessão é encerrada, os dados privados saem do cache, aparece um aviso e o login abre com `redirect` para a página atual.
- **Rotas privadas** (`/perfil`, `/pagamento`, `/pedidos`) usam `beforeLoad` e redirecionam para o login com retorno. O `redirect` só aceita caminhos da própria origem (rejeita `//`, `\`, caracteres de controle e qualquer URL que resolva para outra origem).
- **Retomada do fluxo:** o formulário de pagamento é salvo como rascunho no `sessionStorage` por usuário. Se a sessão expira no meio da compra, o usuário entra de novo e volta para o pagamento com os dados preenchidos. No logout voluntário, os rascunhos são apagados.
- **Troca de usuário:** todas as consultas privadas usam a chave `['private', userId, ...]`. Ao iniciar ou encerrar uma sessão, esse ramo inteiro do cache é cancelado e descartado, então nenhum dado de uma conta aparece para outra.

## Estado do carrinho

- O carrinho vive no servidor (simulado), não no cliente. O cliente guarda só o ID do carrinho de visitante.
- O dono do cache é decidido **no momento da resposta**, não da renderização. Isso evita gravar a resposta de um usuário no cache do visitante quando a sessão ainda está sendo carregada.
- **Mescla no login:** o carrinho do visitante é mesclado no do usuário. Quantidades acima da disponibilidade são ajustadas e informadas, e qualquer busca do carrinho em andamento é cancelada antes de gravar o resultado da mescla.
- **Itens:** cada item guarda o preço de quando foi adicionado. Se o preço atual for diferente, a interface mostra o aviso "Preço atualizado".
- **Cotação:** o subtotal, o desconto, a taxa e o total exibidos vêm da cotação do servidor, com chave `[dono, 'quote', versão do carrinho, { cupom, rede }]`. O cupom fica na URL (`?cupom=`) e é validado pela API. O checkout fica bloqueado enquanto houver item sem disponibilidade.

## Estratégia de cache

| Dado                             | Chave                                       | Política                                                                                      |
| -------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lista do catálogo                | `['catalog', 'list', params]`               | Mantém a página anterior durante a troca (`keepPreviousData`); os parâmetros vêm da URL       |
| Detalhe, destaques, relacionados | `['catalog', ...]`                          | `staleTime` de 1 a 5 min; atualizados pelos eventos de tempo real                             |
| Sessão                           | `['session']`                               | `staleTime: Infinity`; muda só no login, logout ou expiração                                  |
| Dados privados                   | `['private', userId, ...]`                  | Descartados por inteiro na troca de sessão                                                    |
| Carrinho                         | `[dono, 'cart']`                            | `staleTime` de 30 s; as mutations gravam a resposta do servidor diretamente                   |
| Cotação                          | `[dono, 'quote', versãoDoCarrinho, pedido]` | Nova cotação a cada mudança de carrinho, cupom ou rede                                        |
| Pedido                           | `['private', userId, 'orders', id]`         | Consulta periódica enquanto pendente: a cada 5 s com tempo real conectado, a cada 1 s sem ele |

As consultas repetem até duas vezes só erros recuperáveis, com espera exponencial. As mutations não repetem, exceto a criação de pedido, que é idempotente. Favoritar usa atualização otimista com reversão em caso de erro.

Respostas fora de ordem não sobrescrevem o estado, porque cada combinação de filtros tem sua própria chave: a resposta antiga só preenche a chave antiga.

## Reconciliação entre REST e Socket.IO

1. **Validação:** todo evento é validado pelo schema Zod; eventos inválidos são ignorados.
2. **Deduplicação:** o cliente guarda os últimos 500 `eventId` e descarta repetidos.
3. **Ordem:** para cada recurso, o cliente guarda a maior versão aplicada e descarta eventos com versão menor ou igual. Ao aplicar no cache, também compara com a versão já presente, para um evento não sobrescrever um dado mais novo que veio do REST.
4. **Aplicação:**
   - `nft.updated` atualiza o detalhe, as listas, os destaques e os relacionados direto no cache, sem nova requisição. Se o NFT estiver no carrinho, carrinho e cotação são refeitos. Buscas em andamento são canceladas antes, para uma resposta antiga não chegar depois do evento. Só então o usuário é avisado da mudança de preço ou disponibilidade, comparando com o carrinho atualizado (assim a própria compra não gera um aviso falso de "esgotou").
   - `order.updated` atualiza o pedido no cache. Se o usuário não estiver na página do pedido, aparece um aviso com o botão "Ver pedido".
5. **Reconexão:** reconexão automática com espera de 1 a 8 s. Ao reconectar, o cliente refaz as consultas do catálogo, do carrinho, da cotação e dos pedidos para recuperar eventos perdidos, e avisa que a conexão voltou. Enquanto estiver desconectado, um aviso discreto informa o estado.
6. **Checkout:** se o preço mudar durante a revisão, a cotação antiga é recusada pelo servidor na hora de assinar, e a revisão mostra os novos valores. O REST é sempre a fonte de verdade; o tempo real só antecipa a atualização.
7. **Pedido pendente:** a página do pedido consulta o REST periodicamente e também recebe o evento. Ao voltar ao pagamento com um pedido pendente, o usuário é levado a acompanhá-lo em vez de criar outro.

### Simulação do Socket.IO com MSW

- O MSW remove `/socket.io/` do caminho antes de casar a URL, então o handler aponta para a origem. Conexões que não são do Socket.IO (como o HMR do Vite) seguem para o servidor real.
- O `socket.io-client` guarda a referência ao `WebSocket` quando o módulo carrega. Por isso ele é importado sob demanda, depois de o MSW instalar a interceptação.
- O servidor simulado envia o ping do Engine.IO a cada 20 s, para o cliente não encerrar a conexão por inatividade.

## Performance e Lighthouse

Mediana de 3 medições por página e perfil, com build de produção e cenário padrão dos mocks (detalhes em `lighthouse/summary.md`).

| Perfil  | Página  | Performance | Accessibility | Best Practices | SEO | LCP    | CLS   | TBT    |
| ------- | ------- | ----------- | ------------- | -------------- | --- | ------ | ----- | ------ |
| mobile  | início  | 84          | 100           | 100            | 100 | 4,25 s | 0     | 117 ms |
| mobile  | detalhe | 84          | 100           | 100            | 100 | 4,25 s | 0     | 102 ms |
| desktop | início  | 99          | 100           | 100            | 100 | 0,91 s | 0,005 | 0 ms   |
| desktop | detalhe | 99          | 100           | 100            | 100 | 0,91 s | 0     | 0 ms   |

**Otimizações aplicadas:**

- Mocks e app baixados em paralelo, em vez de em sequência.
- Diálogo de login (e `react-hook-form`) carregado sob demanda.
- Rotas divididas automaticamente pelo TanStack Router.
- Tela de carregamento estática no `index.html`: o FCP mobile caiu de 3,4 s para 1,75 s.
- Imagens em WebP com `srcset` em quatro larguras e prioridade alta na imagem principal.
- Fontes servidas pelo próprio site.
- Esqueletos com a altura da tela no desktop, o que zerou o CLS do detalhe (era 0,211).

**Por que o mobile fica em 84 (meta 90):** o LCP mobile é de 4,25 s. Antes de a imagem principal poder carregar, o navegador precisa baixar e executar cerca de 390 KB gzip de JavaScript, e **172 KB disso são o próprio MSW** (incluindo as bibliotecas de cookies que ele usa). Depois ainda vêm o registro do Service Worker e a latência simulada do cenário padrão (120–420 ms por requisição), e só então a imagem é descoberta. Com o 4G lento e a CPU 4× mais lenta da emulação mobile, isso empurra o LCP. TBT (≈110 ms) e CLS (0) estão dentro das faixas boas. Remover o MSW da rota crítica seria uma simplificação exclusiva para a pontuação, o que o enunciado proíbe. Com uma API real (`VITE_API_MOCKING=disabled`), esses 172 KB e a etapa do Service Worker saem do carregamento.

O Lighthouse é executado por `scripts/lighthouse-audit.mjs`, e não pelo `lhci`, porque o `chrome-launcher` do `lhci` não consegue iniciar o navegador neste ambiente Windows (`spawn UNKNOWN`). O script usa a API oficial do Lighthouse num Chromium do Playwright.

## Acessibilidade

- Link "Pular para o conteúdo", landmarks e hierarquia de títulos.
- Todos os campos com rótulo; erros associados por `aria-describedby`, com `aria-invalid` e foco no primeiro campo inválido, inclusive em seções recolhíveis no mobile.
- Diálogos com foco inicial no primeiro campo, foco preso e devolvido ao elemento que os abriu.
- Estados anunciados: resultados do catálogo (`aria-live`), carregamentos (`aria-busy`), favoritos (`aria-pressed`), pedido pendente e erros (`role="status"` / `role="alert"`).
- Controles visualmente customizados (filtros, edições, carteiras, provedores) usam inputs nativos acessíveis.
- Respeito a `prefers-reduced-motion` e sem overflow horizontal, verificado nos testes.

## Segurança

- CSP restritiva (`script-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), além de `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy` no `vercel.json`. A CSP foi verificada sem violações no build de produção, incluindo tempo real e compra.
- Nenhum HTML é injetado (`dangerouslySetInnerHTML` não é usado); dados do usuário são sempre renderizados como texto.
- Links externos com `rel="noopener noreferrer"`. O link do explorador de blocos só é aceito se for `https`. O avatar só aceita imagem PNG/JPG/WebP embutida ou `https`; SVG é recusado.
- Isolamento entre usuários verificado: pedidos, conexões de carteira, cotações, carteiras, favoritos e carrinho de outra conta respondem 404 ou não aparecem, e eventos de pedido só chegam ao dono.
- `npm audit --omit=dev`: nenhuma vulnerabilidade. Os alertas do `npm audit` completo estão todos na cadeia de dependências do Lighthouse 12.6.1, ferramenta de desenvolvimento que não vai para o site. A correção exige o Lighthouse 13.6.0, publicado na véspera da entrega, e não foi adotada para não invalidar as medições reportadas.

## Decisões de UX e desvios do Figma

| Ponto                      | Decisão                                                                                                                                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Faixa entre telas          | O layout desktop começa em **900 px**, não em 1024 px, para notebooks com zoom e janelas menores não caírem no layout mobile. De 900 a 1279 px, espaçamentos e larguras são reduzidos; a partir de 1280 px, o layout é o do Figma. Tablets em pé (até 899 px) usam o layout mobile. |
| Formulário do pagamento    | O Figma repete os campos da carteira salva. O formulário é preenchido com a carteira escolhida: "Tipo de carteira" é o provedor (sincronizado com "Carteira e rede"), o endereço é somente leitura e "Usar outra carteira?" alterna para a carteira secundária.                     |
| Pagamento mobile           | Os dados do colecionador ficam numa seção recolhível, para a escolha de carteira e o total aparecerem primeiro. A seção abre sozinha quando há erro.                                                                                                                                |
| Revisão antes de assinar   | Diálogo de revisão (não presente no Figma) com itens, total, carteira e rede, simulando a assinatura na carteira e mostrando mudanças de preço antes da confirmação.                                                                                                                |
| Confirmação                | O recibo do Figma é usado também para os estados pendente e recusado, como um modal sobre a página do pedido. Na tela estreita, a coluna "Edições" vira "(x N)" abaixo do nome.                                                                                                     |
| Itens fora do escopo       | Criadores, "Ler mais" do blog, login com Google e Facebook, redes sociais, central de ajuda e Atividade, Ofertas, Arquivos baixados e Suporte aparecem esmaecidos e sem ação, com o selo "Em breve" (ou "em breve" para leitores de tela), para não aparentarem funcionar.          |
| Funcionalidades auxiliares | Lista de interesse (`/perfil/favoritos`), recuperação de senha, newsletter e "Aprenda" (leva ao Diário da Cunhagem) foram implementadas pelo mock.                                                                                                                                  |
| Barra mobile               | O coração abre a lista de interesse. A barra fica oculta no detalhe, no carrinho e no pagamento, que têm barras de ação próprias no Figma.                                                                                                                                          |
| Ícones                     | Ícones do Figma (Iconly) substituídos pelos equivalentes do `lucide-react`; ícones de marcas desenhados em SVG. O ícone do recibo é o `CircleCheckBig`.                                                                                                                             |
| Imagens e fontes           | Artes exportadas do Figma (PNG de 1254 px) e convertidas para WebP em 160, 320, 640 e 960 px (`npm run images`). Roboto Mono servida localmente.                                                                                                                                    |
| Avisos                     | Toasts no topo da tela; o aviso de tempo real desconectado fica acima da barra mobile.                                                                                                                                                                                              |

## Limitações conhecidas

- O "servidor" simulado roda dentro de cada aba: duas abas abertas não recebem eventos uma da outra, e cada contexto de navegador tem seu próprio banco simulado.
- O token de sessão fica no `localStorage`, exposto a scripts da página em caso de XSS. A CSP e a ausência de HTML injetado reduzem esse risco; numa API real, o ideal seria um cookie `HttpOnly`.
- O banco simulado pode ser alterado pelo próprio usuário no `localStorage`, e `window.__kurioMocks` fica disponível no deploy de propósito, para a avaliação dos cenários.
- A conexão de carteira, a assinatura e o hash da transação são simulados: o link "Ver no Etherscan" abre o explorador real com um hash fictício, que não existe na rede.
- A recuperação de senha não envia e-mail; o fluxo termina na confirmação de envio.
- As baselines visuais foram geradas no Windows e precisam ser regeneradas em outros sistemas.
- Performance mobile abaixo da meta, pelos motivos descritos acima.
