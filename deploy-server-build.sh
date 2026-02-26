#!/bin/bash

# Deploy fazendo build diretamente no servidor com configuração de mirror

set -e

SERVER="root@72.60.195.200"
DEPLOY_PATH="/var/www/prevendas"

echo "🚀 Deploy com build no servidor..."

# Criar script de configuração e build
cat > /tmp/server-deploy.sh << 'ENDSCRIPT'
#!/bin/bash
set -e

cd /var/www/prevendas

echo "🔄 Sincronizando frontend com o código da raiz..."
rsync -a --delete src/ frontend/src/
rsync -a --delete public/ frontend/public/
rsync -a --delete prisma/ frontend/prisma/
cp package.json package-lock.json next.config.ts tailwind.config.ts postcss.config.mjs tsconfig.json components.json vercel.json frontend/ 2>/dev/null || true

echo "🔧 Configurando Docker daemon para usar mirror..."
# Criar ou atualizar daemon.json
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.gcr.io"
  ],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

echo "🔄 Reiniciando Docker daemon..."
systemctl restart docker
sleep 5

echo "🛑 Parando container antigo..."
docker stop prevendas-frontend 2>/dev/null || true
docker rm prevendas-frontend 2>/dev/null || true

echo "🗑️  Limpando imagens antigas..."
docker rmi prevendas-frontend:latest 2>/dev/null || true

echo "🔨 Fazendo build do frontend (com timeout de 10 minutos)..."
timeout 600 docker build -t prevendas-frontend:latest -f frontend/Dockerfile frontend/ || {
  echo "❌ Build falhou ou timeout. Tentando com --no-cache..."
  timeout 600 docker build --no-cache -t prevendas-frontend:latest -f frontend/Dockerfile frontend/
}

echo "🚀 Iniciando novo container..."
docker run -d \
  --name prevendas-frontend \
  --restart always \
  -e NEXT_PUBLIC_API_URL=https://prevendas.chorstconsult.com.br/api \
  -e NODE_ENV=production \
  -p 127.0.0.1:3010:3000 \
  prevendas-frontend:latest

echo "⏳ Aguardando container iniciar..."
sleep 15

echo "✅ Verificando status..."
docker ps | grep prevendas-frontend

echo "🔍 Testando conectividade..."
for i in {1..10}; do
  if curl -s http://127.0.0.1:3010 > /dev/null; then
    echo "✅ Container respondendo!"
    break
  fi
  echo "Tentativa $i/10..."
  sleep 3
done

echo ""
echo "✅ Deploy concluído!"
echo "📊 Status dos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

ENDSCRIPT

# Enviar script para o servidor
echo "📤 Enviando script para o servidor..."
scp -O /tmp/server-deploy.sh ${SERVER}:/tmp/

# Executar no servidor
echo "🔧 Executando deploy no servidor..."
ssh ${SERVER} "bash /tmp/server-deploy.sh"

# Limpar
rm /tmp/server-deploy.sh

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://prevendas.chorstconsult.com.br"
echo ""
echo "📝 Comandos úteis:"
echo "  Ver logs: ssh ${SERVER} 'docker logs -f prevendas-frontend'"
echo "  Status: ssh ${SERVER} 'docker ps'"
echo "  Reiniciar: ssh ${SERVER} 'docker restart prevendas-frontend'"
