#!/bin/bash
# Script para deploy manual no Vercel
echo "🚀 Fazendo deploy no Vercel..."

# Substitua pela URL do seu Deploy Hook atual
curl -X POST https://api.vercel.com/v1/integrations/deploy/[SEU_PROJETO_ID]/[SEU_HOOK_ID]

echo "✅ Deploy iniciado!"