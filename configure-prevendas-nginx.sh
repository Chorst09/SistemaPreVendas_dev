#!/bin/bash

# Script para configurar Nginx para prevendas.chorstconsult.com.br

SERVER="root@72.60.195.200"

echo "🔧 Configurando Nginx para prevendas.chorstconsult.com.br..."

ssh $SERVER << 'ENDSSH'

# Criar configuração Nginx
cat > /etc/nginx/sites-available/prevendas.chorstconsult.com.br << 'EOF'
server {
    listen 80;
    server_name prevendas.chorstconsult.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name prevendas.chorstconsult.com.br;

    ssl_certificate /etc/letsencrypt/live/prevendas.chorstconsult.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prevendas.chorstconsult.com.br/privkey.pem;

    access_log /var/log/nginx/prevendas.access.log;
    error_log /var/log/nginx/prevendas.error.log;

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Criar symlink
ln -sf /etc/nginx/sites-available/prevendas.chorstconsult.com.br /etc/nginx/sites-enabled/

# Obter certificado SSL
if [ ! -d "/etc/letsencrypt/live/prevendas.chorstconsult.com.br" ]; then
    echo "📜 Obtendo certificado SSL..."
    certbot certonly --nginx \
        --email admin@chorstconsult.com.br \
        --agree-tos \
        --no-eff-email \
        -d prevendas.chorstconsult.com.br
fi

# Testar configuração
echo "🧪 Testando configuração Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração OK! Recarregando Nginx..."
    systemctl reload nginx
    echo "✅ Nginx recarregado!"
else
    echo "❌ Erro na configuração Nginx!"
    exit 1
fi

echo ""
echo "✅ Configuração Nginx concluída!"
echo "🌐 prevendas.chorstconsult.com.br agora aponta para:"
echo "   - Frontend: localhost:3010"
echo "   - Backend: localhost:3011"

ENDSSH

echo ""
echo "✅ Configuração aplicada!"
echo ""
echo "Próximo passo: Fazer deploy da aplicação"
echo "Execute: ./deploy-with-existing-nginx.sh"
