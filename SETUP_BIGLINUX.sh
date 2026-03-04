#!/bin/bash

# Script para configurar Shine Spend no Big Linux
# Execute este script no Big Linux para clonar e preparar o projeto

set -e

echo "🚀 Configurando Shine Spend no Big Linux..."
echo ""

# Definir variáveis
REPO_URL="git@github.com:sevenstamp777/shine-spend.git"
PROJECT_DIR="$HOME/shine-spend"

# Passo 1: Clonar repositório
echo "📥 Clonando repositório..."
if [ -d "$PROJECT_DIR" ]; then
    echo "⚠️  Diretório $PROJECT_DIR já existe. Atualizando..."
    cd "$PROJECT_DIR"
    git pull origin main
else
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

echo ""
echo "✅ Repositório pronto em: $PROJECT_DIR"
echo ""

# Passo 2: Instalar dependências
echo "📦 Instalando dependências..."
npm install

echo ""
echo "✅ Dependências instaladas!"
echo ""

# Passo 3: Criar arquivo .env.local
echo "🔐 Criando arquivo .env.local..."
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://neondb_owner:npg_gul3YSt1MkWV@ep-steep-forest-aig36lp1-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
GITHUB_ID=Ov23ctQxwgQmhAhQqAX1
GITHUB_SECRET=6245c615caf4e62b9830b904c7fc3394fcd88d94
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=shine-spend-secret-key-development-2024
EOF

echo "✅ Arquivo .env.local criado!"
echo ""

# Passo 4: Exibir próximos passos
echo "════════════════════════════════════════════════════════════"
echo "✨ Shine Spend configurado com sucesso!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Testar localmente:"
echo "   cd $PROJECT_DIR"
echo "   npm run dev"
echo ""
echo "2. Fazer push para GitHub:"
echo "   cd $PROJECT_DIR"
echo "   git push origin main"
echo ""
echo "3. Fazer deploy na Vercel:"
echo "   - Acesse https://vercel.com/new"
echo "   - Selecione seu repositório"
echo "   - Configure as variáveis de ambiente"
echo "   - Clique em Deploy"
echo ""
echo "📚 Documentação:"
echo "   - DEPLOY_FINAL.md - Guia passo a passo"
echo "   - DEPLOYMENT.md - Instruções detalhadas"
echo "   - RESUMO_PROJETO.md - Resumo executivo"
echo ""
echo "════════════════════════════════════════════════════════════"
