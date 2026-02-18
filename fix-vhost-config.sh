#!/bin/bash

# Script para investigar e corrigir configuração de virtual hosts

SERVER="root@72.60.195.200"

echo "🔍 Investigando configuração do servidor..."

ssh $SERVER << 'ENDSSH'

echo "=== Verificando servidores web rodando ==="
ps aux | grep -E 'nginx|apache|httpd' | grep -v grep

echo ""
echo "=== Verificando portas em uso ==="
netstat -tlnp | grep -E ':80|:443|:3000|:3001'

echo ""
echo "=== Verificando configurações Nginx ==="
if [ -d "/etc/nginx/sites-enabled" ]; then
    ls -la /etc/nginx/sites-enabled/
    echo ""
    echo "--- Conteúdo dos virtual hosts ---"
    for file in /etc/nginx/sites-enabled/*; do
        echo "=== $file ==="
        cat "$file"
        echo ""
    done
fi

echo ""
echo "=== Verificando configurações Apache ==="
if [ -d "/etc/apache2/sites-enabled" ]; then
    ls -la /etc/apache2/sites-enabled/
    echo ""
    echo "--- Conteúdo dos virtual hosts ---"
    for file in /etc/apache2/sites-enabled/*; do
        echo "=== $file ==="
        cat "$file"
        echo ""
    done
fi

echo ""
echo "=== Verificando containers Docker ==="
docker ps -a

echo ""
echo "=== Verificando diretórios de aplicações ==="
ls -la /var/www/

ENDSSH

echo ""
echo "✅ Investigação concluída!"
echo ""
echo "Próximos passos:"
echo "1. Analisar a saída acima"
echo "2. Identificar qual servidor web está fazendo o proxy"
echo "3. Ajustar configuração para rotear prevendas.chorstconsult.com.br corretamente"
