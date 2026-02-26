#!/bin/bash

# Deploy com build local e envio da imagem para o servidor

set -e

SERVER="root@72.60.195.200"
IMAGE_NAME="prevendas-frontend"
IMAGE_TAG="latest"

echo "🚀 Deploy com build local..."

# Garantir que o código do frontend está alinhado com a raiz (ambiente de teste)
echo "🔄 Sincronizando frontend com o código da raiz..."
rsync -a --delete src/ frontend/src/
rsync -a --delete public/ frontend/public/
rsync -a --delete prisma/ frontend/prisma/
cp package.json package-lock.json next.config.ts tailwind.config.ts postcss.config.mjs tsconfig.json components.json vercel.json frontend/ 2>/dev/null || true

# Build da imagem localmente
echo "🔨 Fazendo build local da imagem..."
cd frontend
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
cd ..

# Salvar imagem em arquivo
echo "💾 Salvando imagem em arquivo..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} | gzip > /tmp/${IMAGE_NAME}.tar.gz

# Enviar para o servidor
echo "📤 Enviando imagem para o servidor..."
scp -O /tmp/${IMAGE_NAME}.tar.gz ${SERVER}:/tmp/

# Carregar e iniciar no servidor
echo "🚀 Carregando e iniciando no servidor..."
ssh ${SERVER} << 'ENDSSH'
# Carregar imagem
echo "📦 Carregando imagem..."
docker load < /tmp/prevendas-frontend.tar.gz

# Parar container antigo se existir
echo "🛑 Parando container antigo..."
docker stop prevendas-frontend 2>/dev/null || true
docker rm prevendas-frontend 2>/dev/null || true

# Iniciar novo container
echo "🚀 Iniciando novo container..."
docker run -d \
  --name prevendas-frontend \
  --restart always \
  -e NEXT_PUBLIC_API_URL=https://prevendas.chorstconsult.com.br/api \
  -e NODE_ENV=production \
  -p 127.0.0.1:3010:3000 \
  prevendas-frontend:latest

# Aguardar inicialização
echo "⏳ Aguardando container iniciar..."
sleep 10

# Verificar status
echo "✅ Verificando status..."
docker ps | grep prevendas-frontend

# Testar conectividade
echo "🔍 Testando conectividade..."
curl -I http://127.0.0.1:3010 || echo "⚠️  Container ainda inicializando..."

# Limpar arquivo temporário
rm /tmp/prevendas-frontend.tar.gz

echo ""
echo "✅ Container iniciado com sucesso!"
ENDSSH

# Limpar arquivo local
rm /tmp/${IMAGE_NAME}.tar.gz

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://prevendas.chorstconsult.com.br"
echo ""
echo "📝 Verificação:"
echo "  ssh ${SERVER} 'docker logs prevendas-frontend'"
