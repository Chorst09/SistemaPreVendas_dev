# 🔧 Correção do Deploy - Servidor com Múltiplas Aplicações

## Situação Identificada

Você tem múltiplos subdomínios no mesmo servidor KVM (72.60.195.200):
- `crm.chorstconsult.com.br` → CRM Comercial
- `financas.chorstconsult.com.br` → Sistema Financeiro
- `prevendas.chorstconsult.com.br` → Sistema de Prevendas (novo)
- E outros...

O problema é que já existe um servidor web (Nginx ou Apache) configurado que está fazendo o roteamento dos domínios.

## Solução

Criamos um novo script que:
1. **NÃO cria um container Nginx próprio** (usa o Nginx do host)
2. **Usa portas locais** (3010 para frontend, 3011 para backend)
3. **Adiciona configuração ao Nginx existente** como um novo virtual host

## Passo 1: Investigar Configuração Atual

Execute para ver como está configurado:

```bash
./fix-vhost-config.sh
```

Isso mostrará:
- Qual servidor web está rodando (Nginx ou Apache)
- Quais portas estão em uso
- Configurações de virtual hosts existentes
- Containers Docker rodando

## Passo 2: Executar Deploy Correto

```bash
./deploy-with-existing-nginx.sh
```

Este script:
- ✅ Cria containers Docker para PostgreSQL, Backend e Frontend
- ✅ Usa portas locais (127.0.0.1:3010 e 127.0.0.1:3011)
- ✅ Adiciona configuração ao Nginx existente
- ✅ Obtém certificado SSL
- ✅ Recarrega Nginx

## Arquitetura

```
Internet (HTTPS)
    ↓
Nginx (Host) - Porta 443
    ↓
    ├─→ crm.chorstconsult.com.br → Aplicação CRM
    ├─→ financas.chorstconsult.com.br → Aplicação Financeira
    └─→ prevendas.chorstconsult.com.br
            ↓
            ├─→ / → Frontend (127.0.0.1:3010)
            └─→ /api → Backend (127.0.0.1:3011)
                        ↓
                    PostgreSQL (container interno)
```

## Diferenças do Script Anterior

### Script Anterior (ERRADO para seu caso)
- ❌ Criava container Nginx próprio
- ❌ Tentava usar portas 80/443 (já em uso)
- ❌ Conflitava com Nginx existente

### Script Novo (CORRETO)
- ✅ Usa Nginx do host
- ✅ Portas locais (3010, 3011)
- ✅ Adiciona virtual host ao Nginx existente
- ✅ Não conflita com outras aplicações

## Configuração Nginx Adicionada

O script adiciona este arquivo em `/etc/nginx/sites-available/prevendas.chorstconsult.com.br`:

```nginx
upstream prevendas_frontend {
    server 127.0.0.1:3010;
}

upstream prevendas_backend {
    server 127.0.0.1:3011;
}

server {
    listen 80;
    server_name prevendas.chorstconsult.com.br;
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name prevendas.chorstconsult.com.br;

    ssl_certificate /etc/letsencrypt/live/prevendas.chorstconsult.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prevendas.chorstconsult.com.br/privkey.pem;

    location / {
        proxy_pass http://prevendas_frontend;
        # ... headers ...
    }

    location /api {
        proxy_pass http://prevendas_backend;
        # ... headers ...
    }
}
```

## Se Você Usa Apache em Vez de Nginx

O script detecta automaticamente. Se for Apache, você precisará adicionar manualmente:

```apache
<VirtualHost *:443>
    ServerName prevendas.chorstconsult.com.br
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/prevendas.chorstconsult.com.br/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/prevendas.chorstconsult.com.br/privkey.pem
    
    ProxyPreserveHost On
    
    ProxyPass /api http://127.0.0.1:3011
    ProxyPassReverse /api http://127.0.0.1:3011
    
    ProxyPass / http://127.0.0.1:3010/
    ProxyPassReverse / http://127.0.0.1:3010/
</VirtualHost>
```

## Verificar Após Deploy

### 1. Containers rodando
```bash
ssh root@72.60.195.200 'docker ps'
```

Deve mostrar:
- prevendas-frontend
- prevendas-backend
- prevendas-db

### 2. Portas em uso
```bash
ssh root@72.60.195.200 'netstat -tlnp | grep -E "3010|3011"'
```

### 3. Nginx configurado
```bash
ssh root@72.60.195.200 'nginx -t'
ssh root@72.60.195.200 'ls -la /etc/nginx/sites-enabled/ | grep prevendas'
```

### 4. Testar acesso
```bash
curl -I https://prevendas.chorstconsult.com.br
```

## Troubleshooting

### Erro: Porta já em uso
Se as portas 3010 ou 3011 já estiverem em uso, edite o `docker-compose.yml` e use outras portas:
```yaml
ports:
  - "127.0.0.1:3012:3000"  # Frontend
  - "127.0.0.1:3013:3001"  # Backend
```

### Erro: Nginx não recarrega
```bash
ssh root@72.60.195.200 'nginx -t'  # Testar configuração
ssh root@72.60.195.200 'systemctl status nginx'  # Ver status
ssh root@72.60.195.200 'tail -f /var/log/nginx/error.log'  # Ver erros
```

### Erro: Certificado SSL não encontrado
```bash
ssh root@72.60.195.200 'certbot certonly --nginx -d prevendas.chorstconsult.com.br'
```

### Aplicação não responde
```bash
# Ver logs
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f'

# Testar diretamente
ssh root@72.60.195.200 'curl http://127.0.0.1:3010'  # Frontend
ssh root@72.60.195.200 'curl http://127.0.0.1:3011/api/health'  # Backend
```

## Comandos Úteis

```bash
# Ver todas as aplicações rodando
ssh root@72.60.195.200 'docker ps'

# Ver configurações Nginx
ssh root@72.60.195.200 'ls -la /etc/nginx/sites-enabled/'

# Recarregar Nginx
ssh root@72.60.195.200 'systemctl reload nginx'

# Reiniciar Sistema de Prevendas
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose restart'

# Ver logs em tempo real
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f'
```

## Resumo

1. **Execute primeiro**: `./fix-vhost-config.sh` (para investigar)
2. **Execute o deploy**: `./deploy-with-existing-nginx.sh`
3. **Verifique**: `https://prevendas.chorstconsult.com.br`

O sistema será instalado sem conflitar com suas outras aplicações! 🎉
