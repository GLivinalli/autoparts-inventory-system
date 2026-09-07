# AutoParts Inventario — V1

Sistema web de controle de inventario de pecas automotivas de reposicao.
Backend em Node.js/TypeScript + PostgreSQL, frontend em React/TypeScript,
responsivo (desktop, tablet e celular).

> Este projeto foi gerado como um codigo-fonte completo e organizado, mas
> **nao foi instalado nem executado neste ambiente** (o ambiente que gerou o
> codigo nao tem acesso a internet para baixar pacotes npm nem para subir um
> Postgres). Siga o guia abaixo na sua maquina para rodar de verdade.

## Principio fundamental

**A quantidade de uma peca nunca e alterada diretamente.** Toda entrada ou
retirada de estoque passa por uma transacao de banco de dados que:

1. Verifica a peca e a quantidade disponivel (nunca permite estoque negativo)
2. Grava um registro em `inventory_movements` (peca, tipo, quantidade,
   estoque antes/depois, usuario, data/hora)
3. So entao atualiza `parts.quantity`

Isso vale inclusive para o estoque informado no momento do cadastro: ele gera
um primeiro movimento de `ENTRADA` com a observacao "Estoque inicial", em vez
de gravar o numero direto na peca.

## Estrutura do repositorio

```
inventory-system/
├── docker-compose.yml       # Postgres local para desenvolvimento
├── backend/                 # API Node.js + TypeScript + Prisma
│   ├── prisma/schema.prisma # Modelo de dados completo
│   ├── prisma/seed.ts       # Cria usuario admin + montadoras padrao
│   └── src/
│       ├── modules/         # auth, users, parts, movements, manufacturers,
│       │                    # dashboard, upload, audit — cada um com
│       │                    # controller/service/repository/validation
│       ├── middleware/      # auth (JWT), rbac (permissoes), validate (zod),
│       │                    # rateLimit, errorHandler
│       └── config, db, utils, types
└── frontend/                # React + TypeScript + Tailwind (Vite)
    └── src/
        ├── api/              # Chamadas HTTP tipadas para cada modulo
        ├── components/       # layout, common (busca/filtro/paginacao/...),
        │                     # parts (form, tabela, card, modais)
        ├── context/          # AuthContext, ToastContext
        └── pages/            # Login, Dashboard, PartsList, History, Users
```

## Como rodar localmente

### 1. Banco de dados

```bash
docker compose up -d
```

Isso sobe um Postgres 16 em `localhost:5432` com usuario/senha/banco
`autoparts` / `autoparts` / `autoparts_inventory` (ja configurados no
`.env.example` do backend).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate      # cria as tabelas
npm run seed                # cria o usuario admin e as montadoras padrao
npm run dev                 # http://localhost:3333
```

O `seed` imprime no terminal o e-mail e a senha inicial do administrador
(configuraveis em `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` no `.env`).
Troque essa senha assim que possivel pela tela de perfil (endpoint
`POST /auth/change-password`).

### 3. Fotos das pecas (Cloudflare R2)

O upload de fotos usa object storage compativel com S3 (Cloudflare R2), nunca
o PostgreSQL. Para funcionar de verdade, preencha no `.env` do backend:

```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

Enquanto essas variaveis nao forem preenchidas, o cadastro de pecas continua
funcionando normalmente — apenas o upload de foto vai falhar. As demais
telas funcionam sem nenhuma foto.

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Acesse `http://localhost:5173` e entre com o usuario admin criado pelo seed.

## Decisoes de arquitetura e seguranca

- **Monolito modular**, sem microservicos (conforme escopo da V1). Cada
  dominio (`auth`, `users`, `parts`, `movements`, `manufacturers`,
  `dashboard`, `upload`, `audit`) tem sua propria pasta com
  controller/service/repository/validation isolados.
- **Autenticacao**: access token JWT de vida curta (15 min) em cookie
  `HttpOnly` + `SameSite=strict`; refresh token opaco (nao e um JWT) guardado
  com hash SHA-256 no banco, permitindo revogacao real no logout ou troca de
  senha. Nenhum token secreto fica acessivel via JavaScript no navegador.
- **Autorizacao**: `role` (ADMIN/USER) + permissoes granulares por usuario
  (`canCreateParts`, `canEditParts`, `canArchiveParts`, `canStockIn`,
  `canStockOut`, `canManageUsers`), validadas sempre no backend — o frontend
  so esconde botoes por conveniencia, nunca e a unica barreira.
- **Usuario responsavel**: nunca vem do corpo da requisicao. E sempre lido do
  token de sessao no backend (`req.user`), entao e impossivel um usuario se
  passar por outro numa entrada/retirada.
- **Transacoes**: toda mudanca de estoque roda dentro de
  `prisma.$transaction`, com rollback automatico em caso de erro.
- **SKU** unico garantido por constraint `UNIQUE` no Postgres, alem da
  verificacao previa na aplicacao.
- **Upload de fotos**: validado por tamanho, mime type declarado E pelos
  bytes reais do arquivo (`file-type`), nunca confia em extensao ou
  Content-Type informado pelo cliente.
- **Auditoria**: tabela `audit_logs` append-only — nenhuma rota de
  update/delete e exposta para ela, nem para administradores via API.
- **Seguranca geral**: Helmet (headers), CORS restrito ao dominio do
  frontend, rate limiting (geral + reforçado no login), validacao de entrada
  com Zod em todas as rotas, senhas com Argon2id.

## O que fica para depois (fora do escopo da V1, por design)

ERP completo, compras/pedidos/fornecedores/notas fiscais, controle
financeiro, compatibilidade detalhada de veiculos, e-commerce, IA/previsao de
estoque, Redis, Elasticsearch e microservicos. A estrutura modular do
backend foi pensada para que esses modulos possam ser adicionados depois sem
reescrever o que ja existe.

## Proximos passos sugeridos

1. Rodar `npm install` em `backend/` e `frontend/` e corrigir eventuais
   ajustes finos de versao de dependências (o codigo foi escrito mas nao
   pode ser compilado/testado neste ambiente sem acesso a internet).
2. Configurar o bucket R2 e testar o fluxo de upload de foto.
3. Colocar o backend atras de HTTPS (proxy reverso / Cloudflare) antes de
   qualquer uso em producao, já que os cookies de sessao dependem de
   `secure: true` em producao.
4. Revisar a senha do usuario administrador criado pelo seed.
