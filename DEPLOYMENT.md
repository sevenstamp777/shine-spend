# Deployment - Shine Spend na Vercel

## Status: Pronto para Deploy ✅

O projeto está completamente configurado para deploy na Vercel com:
- ✅ Banco de dados Neon Postgres
- ✅ Autenticação GitHub OAuth
- ✅ APIs serverless para transações
- ✅ Sistema de fechamento automático por item

## Pré-requisitos

1. Conta na Vercel (https://vercel.com)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Credenciais já configuradas:
   - `DATABASE_URL` ✅
   - `GITHUB_ID` ✅
   - `GITHUB_SECRET` ✅

## Passo 1: Preparar o Repositório

```bash
cd /home/ubuntu/shine-spend
git init
git add .
git commit -m "Initial commit: Shine Spend com Vercel Postgres e GitHub Auth"
git branch -M main
git remote add origin https://github.com/seu-usuario/shine-spend.git
git push -u origin main
```

## Passo 2: Deploy na Vercel

### Opção A: Via CLI

```bash
npm install -g vercel
vercel
```

### Opção B: Via Dashboard

1. Acesse https://vercel.com/new
2. Selecione seu repositório GitHub
3. Configure as variáveis de ambiente (veja abaixo)
4. Clique em "Deploy"

## Passo 3: Configurar Variáveis de Ambiente

Na Vercel, adicione as seguintes variáveis:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_gul3YSt1MkWV@ep-steep-forest-aig36lp1-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `GITHUB_ID` | `Ov23ctQxwgQmhAhQqAX1` |
| `GITHUB_SECRET` | `6245c615caf4e62b9830b904c7fc3394fcd88d94` |
| `NEXTAUTH_URL` | `https://seu-app.vercel.app` |
| `NEXTAUTH_SECRET` | Gere uma chave segura: `openssl rand -base64 32` |

## Passo 4: Atualizar GitHub OAuth

Após o deploy, você precisa atualizar a URL de callback no GitHub:

1. Acesse https://github.com/settings/developers
2. Selecione seu GitHub App
3. Atualize a **Authorization callback URL** para:
   ```
   https://seu-app.vercel.app/api/auth/callback/github
   ```

## Funcionalidades Implementadas

### Sistema de Transações
- ✅ Criar transação com múltiplos itens
- ✅ Confirmar itens individuais
- ✅ Fechamento automático quando todos os itens confirmados
- ✅ Listar transações com filtros
- ✅ Cálculo de balanço mensal

### Autenticação
- ✅ Login com GitHub
- ✅ Sessão gerenciada com NextAuth.js
- ✅ Dados isolados por usuário

### Banco de Dados
- ✅ Neon Postgres (integrado com Vercel)
- ✅ Drizzle ORM para queries type-safe
- ✅ Migrations automáticas

## Estrutura do Projeto

```
shine-spend/
├── api/                          # Serverless functions (Vercel)
│   ├── auth/[...nextauth].ts    # Autenticação GitHub
│   ├── transactions/
│   │   ├── index.ts             # CRUD de transações
│   │   ├── balance.ts           # Balanço mensal
│   │   └── [id]/items/[itemId]/confirm.ts  # Confirmar itens
│   └── ...
├── src/
│   ├── api/
│   │   ├── auth/auth.ts         # Configuração NextAuth
│   │   ├── db/
│   │   │   ├── schema.ts        # Schema Drizzle
│   │   │   ├── client.ts        # Cliente Neon
│   │   │   └── migrations/      # Migrations SQL
│   │   └── routes/
│   │       └── transactions.ts  # Lógica de transações
│   ├── pages/                   # Páginas React
│   ├── components/              # Componentes React
│   └── hooks/                   # Custom hooks
├── package.json
├── vite.config.ts
├── drizzle.config.ts
└── vercel.json
```

## Testando Localmente

```bash
# Instalar dependências
npm install

# Executar migrations (se necessário)
DATABASE_URL="..." npm run db:migrate

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:8080`

## Troubleshooting

### Erro: "DATABASE_URL is not set"
- Verifique se a variável está configurada na Vercel
- Confirme que a connection string está correta

### Erro: "GitHub OAuth credentials are not configured"
- Verifique `GITHUB_ID` e `GITHUB_SECRET` na Vercel
- Confirme que a callback URL está correta no GitHub

### Erro: "NEXTAUTH_SECRET is not set"
- Gere uma chave segura: `openssl rand -base64 32`
- Configure na Vercel

### Erro: "User not found"
- Verifique se o usuário foi criado no banco de dados
- Confirme que o email está correto

## Próximos Passos

1. ✅ Fazer deploy na Vercel
2. ✅ Testar login com GitHub
3. ✅ Criar transação com itens
4. ✅ Confirmar itens individuais
5. ✅ Validar fechamento automático
6. ✅ Testar em produção

## Suporte

Para mais informações:
- Documentação Vercel: https://vercel.com/docs
- Documentação NextAuth: https://next-auth.js.org
- Documentação Drizzle: https://orm.drizzle.team
- Documentação Neon: https://neon.tech/docs
