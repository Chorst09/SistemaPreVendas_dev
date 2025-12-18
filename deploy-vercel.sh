#!/bin/bash

echo "🚀 Iniciando deploy manual no Vercel..."

# Fazer commit das mudanças pendentes
echo "📝 Fazendo commit das mudanças..."
git add .
git commit -m "deploy: sync with vercel - $(date)"

# Push para o GitHub
echo "📤 Enviando para GitHub..."
git push origin main

# Aguardar um pouco
echo "⏳ Aguardando 5 segundos..."
sleep 5

# Tentar acionar o webhook do Vercel
echo "🔄 Tentando acionar deploy via webhook..."
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_fYYURhwTdt4xUQJzCQWUCKK0R695/abNTx9yHQy"

echo "✅ Deploy iniciado! Verifique o painel do Vercel."