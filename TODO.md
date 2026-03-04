# Shine Spend - TODO

## Fase 1: Backend & Banco de Dados ✅
- [x] Schema Drizzle com tabelas (users, categories, paymentMethods, transactions, transactionItems)
- [x] Autenticação GitHub com NextAuth.js
- [x] API de transações com sistema de fechamento
- [x] Configuração Vercel Postgres (Neon)
- [x] Drizzle Kit configurado
- [x] Hook React para integração com API

## Fase 2: API Routes (Em Progresso)
- [ ] Criar endpoints Express/Next.js para transações
- [ ] Criar endpoints para categorias
- [ ] Criar endpoints para métodos de pagamento
- [ ] Implementar middleware de autenticação
- [ ] Validação de entrada com Zod

## Fase 3: Integração Frontend
- [ ] Atualizar useFinanceData para usar API
- [ ] Migrar dados do localStorage para banco
- [ ] Testar fluxo de login GitHub
- [ ] Testar registro de transações com itens
- [ ] Testar confirmação de itens
- [ ] Testar fechamento automático

## Fase 4: Testes
- [ ] Testar criação de transação com itens
- [ ] Testar confirmação individual de itens
- [ ] Testar fechamento automático quando último item confirmado
- [ ] Testar filtros de transações
- [ ] Testar cálculo de balanço mensal

## Fase 5: Deploy
- [ ] Configurar Neon Postgres no Vercel
- [ ] Configurar GitHub OAuth no Vercel
- [ ] Fazer deploy na Vercel
- [ ] Testar em produção
- [ ] Validar autenticação
- [ ] Validar banco de dados

## Fase 6: Otimizações
- [ ] Cache de dados
- [ ] Otimizar queries
- [ ] Adicionar índices ao banco
- [ ] Melhorar performance de listagem

## Notas
- Sistema de fechamento: transação fecha automaticamente quando TODOS os itens são confirmados
- Precisão de centavos: usar Decimal.js para cálculos monetários
- Autenticação: GitHub OAuth via NextAuth.js
- Banco: Neon Postgres via Drizzle ORM
