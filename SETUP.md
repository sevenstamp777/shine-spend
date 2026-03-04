# Setup - Shine Spend com Vercel Postgres e GitHub Auth

## Pré-requisitos

1. **Conta Vercel** - https://vercel.com
2. **Conta GitHub** - https://github.com
3. **Node.js 18+** - https://nodejs.org

## Passo 1: Configurar Banco de Dados (Neon Postgres)

### No Vercel:
1. Acesse https://vercel.com/storage
2. Clique em "Create Database"
3. Selecione "Postgres" e "Neon"
4. Siga as instruções para criar um banco de dados
5. Copie a connection string `DATABASE_URL`

## Passo 2: Configurar GitHub OAuth

### No GitHub:
1. Acesse https://github.com/settings/developers
2. Clique em "New GitHub App" ou "New OAuth App"
3. Preencha os dados:
   - **Application name**: Shine Spend
   - **Homepage URL**: `https://seu-dominio.vercel.app`
   - **Authorization callback URL**: `https://seu-dominio.vercel.app/api/auth/callback/github`
4. Copie o `Client ID` e `Client Secret`

## Passo 3: Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
DATABASE_URL=postgresql://user:password@host/database
GITHUB_ID=seu_github_client_id
GITHUB_SECRET=seu_github_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=gere_uma_chave_aleatoria_segura
```

Para gerar `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

## Passo 4: Instalar Dependências

```bash
npm install
```

## Passo 5: Executar Migrations (Desenvolvimento)

```bash
npm run db:push
```

## Passo 6: Iniciar em Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`

## Passo 7: Deploy na Vercel

### Via CLI:
```bash
npm install -g vercel
vercel
```

### Via GitHub:
1. Push seu código para GitHub
2. Acesse https://vercel.com/new
3. Selecione seu repositório
4. Configure as variáveis de ambiente
5. Clique em "Deploy"

## Variáveis de Ambiente para Vercel

Adicione no dashboard da Vercel:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Sua connection string Neon |
| `GITHUB_ID` | ID do GitHub OAuth App |
| `GITHUB_SECRET` | Secret do GitHub OAuth App |
| `NEXTAUTH_URL` | `https://seu-dominio.vercel.app` |
| `NEXTAUTH_SECRET` | Chave secreta gerada |

## Funcionalidades Implementadas

✅ Autenticação com GitHub
✅ Banco de dados Postgres (Neon)
✅ Registro de entradas e saídas
✅ Sistema de itens com confirmação individual
✅ Fechamento automático quando todos os itens confirmados
✅ Categorias e métodos de pagamento
✅ Relatórios mensais

## Troubleshooting

### Erro: "DATABASE_URL is not set"
- Verifique se a variável está configurada em `.env.local` (dev) ou no Vercel (prod)

### Erro: "GitHub OAuth credentials are not configured"
- Verifique `GITHUB_ID` e `GITHUB_SECRET`
- Confirme que a callback URL está correta

### Erro: "NEXTAUTH_SECRET is not set"
- Gere uma chave segura com: `openssl rand -base64 32`
- Configure em `.env.local` ou Vercel

## Próximos Passos

1. Testar fluxo completo de login
2. Criar transação com itens
3. Confirmar itens individuais
4. Validar fechamento automático
5. Testar em produção na Vercel
