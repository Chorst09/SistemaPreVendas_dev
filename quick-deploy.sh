#!/bin/bash

# Quick Deploy - Atualiza apenas arquivos modificados e faz rebuild

set -e

SERVER="root@72.60.195.200"
DEPLOY_PATH="/var/www/prevendas"

echo "🚀 Quick Deploy - Atualizando arquivos modificados..."

# Criar diretório temporário
mkdir -p .quick-deploy

# Copiar apenas o globals.css modificado
echo "📦 Copiando globals.css atualizado..."
mkdir -p .quick-deploy/frontend/src/app
cp frontend/src/app/globals.css .quick-deploy/frontend/src/app/

# Enviar para o servidor
echo "📤 Enviando para o servidor..."
rsync -avz .quick-deploy/frontend/src/app/globals.css \
  $SERVER:$DEPLOY_PATH/frontend/src/app/

# Criar script de rebuild no servidor
cat > .quick-deploy/rebuild.sh << 'EOF'
#!/bin/bash
set -e

cd /var/www/prevendas

echo "🛑 Parando frontend..."
docker stop prevendas-frontend || true
docker rm prevendas-frontend || true

echo "🗑️  Removendo imagem antiga..."
docker rmi prevendas-frontend:latest || true

echo "🔨 Fazendo rebuild do frontend..."
docker build -t prevendas-frontend:latest -f frontend/Dockerfile frontend/

echo "🚀 Iniciando novo container..."
docker run -d \
  --name prevendas-frontend \
  --network prevendas-network \
  -e NEXT_PUBLIC_API_URL=https://prevendas.chorstconsult.com.br/api \
  -e NODE_ENV=production \
  -p 127.0.0.1:3010:3000 \
  prevendas-frontend:latest

echo "⏳ Aguardando container iniciar..."
sleep 10

echo "✅ Verificando status..."
docker ps | grep prevendas-frontend

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://prevendas.chorstconsult.com.br"
EOF

chmod +x .quick-deploy/rebuild.sh

# Enviar script
rsync -avz .quick-deploy/rebuild.sh $SERVER:$DEPLOY_PATH/

# Executar rebuild
echo "🔧 Executando rebuild no servidor..."
ssh $SERVER "bash $DEPLOY_PATH/rebuild.sh"

# Limpar
rm -rf .quick-deploy

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesse: https://prevendas.chorstconsult.com.br"
echo ""
echo "📝 Verificação:"
echo "  1. Acesse o site"
echo "  2. Alterne para modo claro"
echo "  3. Verifique se os textos estão escuros"
echo "  4. Force refresh: Cmd+Shift+R"
