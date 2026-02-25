# Deploy das Correções de Tema - Instruções Manuais

## Problema
As mudanças de tema (textos mais escuros no modo claro) foram commitadas no repositório local mas não foram deployadas no servidor de produção.

## Solução - Execute no Servidor (72.60.195.200)

### Opção 1: Rebuild Completo (Recomendado)

```bash
# 1. Conectar ao servidor
ssh root@72.60.195.200

# 2. Parar o container antigo
docker stop prevendas-frontend
docker rm prevendas-frontend

# 3. Remover imagem antiga
docker rmi prevendas-frontend:latest

# 4. Clonar o repositório atualizado
cd /tmp
rm -rf SistemaPreVendas_dev
git clone https://github.com/Chorst09/SistemaPreVendas_dev.git
cd SistemaPreVendas_dev

# 5. Fazer build da nova imagem
docker build -t prevendas-frontend:latest -f frontend/Dockerfile frontend/

# 6. Iniciar novo container
docker run -d \
  --name prevendas-frontend \
  -p 127.0.0.1:3010:3000 \
  prevendas-frontend:latest

# 7. Verificar status
docker ps | grep prevendas-frontend
docker logs prevendas-frontend
```

### Opção 2: Rebuild Rápido (Se git não funcionar)

```bash
# 1. Conectar ao servidor
ssh root@72.60.195.200

# 2. Parar container
docker stop prevendas-frontend
docker rm prevendas-frontend

# 3. Remover imagem
docker rmi prevendas-frontend:latest

# 4. Fazer rebuild sem cache
docker build --no-cache -t prevendas-frontend:latest -f frontend/Dockerfile frontend/

# 5. Iniciar novo container
docker run -d \
  --name prevendas-frontend \
  -p 127.0.0.1:3010:3000 \
  prevendas-frontend:latest

# 6. Verificar
docker ps | grep prevendas-frontend
```

### Opção 3: Restart Simples (Se a imagem já tem as mudanças)

```bash
ssh root@72.60.195.200

# Apenas reiniciar o container
docker restart prevendas-frontend

# Aguardar 5 segundos
sleep 5

# Verificar
docker ps | grep prevendas-frontend
```

## Verificação Pós-Deploy

1. Acesse: https://prevendas.chorstconsult.com.br
2. Alterne para modo claro (botão no header)
3. Verifique se os textos estão **MUITO ESCUROS** (quase preto)
4. Navegue pelos módulos:
   - IT Pricing (Venda/Locação/Serviços)
   - AI Bid Analyzer (Analisar Edital com IA)
5. Force refresh: **Cmd+Shift+R** (Mac) ou **Ctrl+Shift+R** (Windows)

## Mudanças Aplicadas

### globals.css
- `--foreground`: 220 45% 10% (MUITO escuro)
- `--muted-foreground`: 220 15% 35% (mais escuro)
- `--card-foreground`: 220 45% 10% (MUITO escuro)

### AIBidAnalyzer.tsx
- Todos os labels agora usam `text-foreground`
- Removido `text-muted-foreground` de textos principais
- Melhor contraste em modo claro

## Commits Relacionados

```
17c2b19 - Fix: Melhorar contraste de textos em modo claro
3f1a08c - Fix: Complete theme system for IT Pricing and AI Bid Analyzer modules
```

## Troubleshooting

### Container não inicia
```bash
docker logs prevendas-frontend
# Verificar erros de build
```

### Textos ainda estão claros
```bash
# Force refresh no navegador
# Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)

# Ou limpar cache do Docker
docker system prune -a
```

### Nginx não está redirecionando
```bash
# Verificar configuração do Nginx
docker exec nginx cat /etc/nginx/conf.d/prevendas.conf

# Recarregar Nginx
docker exec nginx nginx -s reload
```

## Contato

Se houver problemas, verifique:
1. Status dos containers: `docker ps`
2. Logs do frontend: `docker logs prevendas-frontend`
3. Logs do Nginx: `docker logs nginx`
4. Conectividade: `curl http://localhost:3010`
