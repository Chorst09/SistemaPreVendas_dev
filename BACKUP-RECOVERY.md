# 💾 Backup e Recuperação

## 🔄 Backup Automático

### Script de Backup

Crie um script de backup no servidor:

```bash
ssh root@72.60.195.200 'cat > /var/www/prevendas/backup.sh << "EOF"
#!/bin/bash
BACKUP_DIR="/var/backups/prevendas"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker exec prevendas-db pg_dump -U prevendas sistema_prevendas | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup dos uploads (se houver)
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/prevendas/uploads 2>/dev/null || true

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
EOF'

ssh root@72.60.195.200 'chmod +x /var/www/prevendas/backup.sh'
```

### Agendar Backup Diário (Cron)

```bash
ssh root@72.60.195.200 'crontab -l | { cat; echo "0 2 * * * /var/www/prevendas/backup.sh >> /var/log/prevendas-backup.log 2>&1"; } | crontab -'
```

Isso executa o backup todos os dias às 2h da manhã.

---

## 📥 Fazer Backup Manual

### Backup do Banco de Dados

```bash
# Backup completo
ssh root@72.60.195.200 'docker exec prevendas-db pg_dump -U prevendas sistema_prevendas' > backup_$(date +%Y%m%d).sql

# Backup comprimido
ssh root@72.60.195.200 'docker exec prevendas-db pg_dump -U prevendas sistema_prevendas | gzip' > backup_$(date +%Y%m%d).sql.gz
```

### Backup dos Volumes Docker

```bash
# Backup do volume do PostgreSQL
ssh root@72.60.195.200 'docker run --rm -v prevendas_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_volume_$(date +%Y%m%d).tar.gz /data'
```

### Backup dos Arquivos da Aplicação

```bash
# Baixar todos os arquivos
rsync -avz root@72.60.195.200:/var/www/prevendas/ ./backup_prevendas_$(date +%Y%m%d)/
```

---

## 📤 Restaurar Backup

### Restaurar Banco de Dados

```bash
# De um arquivo SQL
cat backup.sql | ssh root@72.60.195.200 'docker exec -i prevendas-db psql -U prevendas sistema_prevendas'

# De um arquivo comprimido
gunzip -c backup.sql.gz | ssh root@72.60.195.200 'docker exec -i prevendas-db psql -U prevendas sistema_prevendas'
```

### Restaurar Volume do PostgreSQL

```bash
# Parar containers
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose down'

# Restaurar volume
ssh root@72.60.195.200 'docker run --rm -v prevendas_postgres_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/postgres_volume.tar.gz --strip 1"'

# Reiniciar
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose up -d'
```

---

## 🔄 Migração para Novo Servidor

### 1. Fazer Backup Completo

```bash
# No servidor antigo
ssh root@72.60.195.200 'cd /var/www/prevendas && docker exec prevendas-db pg_dump -U prevendas sistema_prevendas' > migration_backup.sql
```

### 2. Preparar Novo Servidor

```bash
# Atualizar IP no script deploy-simple.sh
# Executar deploy no novo servidor
./deploy-simple.sh
```

### 3. Restaurar Dados

```bash
# Restaurar banco no novo servidor
cat migration_backup.sql | ssh root@NOVO_IP 'docker exec -i prevendas-db psql -U prevendas sistema_prevendas'
```

### 4. Atualizar DNS

Apontar `prevendas.chorstconsult.com.br` para o novo IP.

---

## 💡 Estratégia de Backup Recomendada

### Diário
- ✅ Backup do banco de dados (automático via cron)
- ✅ Manter últimos 7 dias

### Semanal
- ✅ Backup completo dos volumes Docker
- ✅ Manter últimas 4 semanas

### Mensal
- ✅ Backup completo da aplicação
- ✅ Download para armazenamento externo
- ✅ Manter últimos 12 meses

### Antes de Atualizações
- ✅ Sempre fazer backup antes de deploy
- ✅ Testar restauração

---

## 🧪 Testar Restauração

É importante testar se os backups funcionam:

```bash
# 1. Criar backup de teste
ssh root@72.60.195.200 'docker exec prevendas-db pg_dump -U prevendas sistema_prevendas' > test_backup.sql

# 2. Criar banco de teste
ssh root@72.60.195.200 'docker exec prevendas-db psql -U prevendas -c "CREATE DATABASE test_restore;"'

# 3. Restaurar no banco de teste
cat test_backup.sql | ssh root@72.60.195.200 'docker exec -i prevendas-db psql -U prevendas test_restore'

# 4. Verificar
ssh root@72.60.195.200 'docker exec prevendas-db psql -U prevendas test_restore -c "\dt"'

# 5. Limpar
ssh root@72.60.195.200 'docker exec prevendas-db psql -U prevendas -c "DROP DATABASE test_restore;"'
```

---

## 📊 Monitorar Espaço de Backup

```bash
# Ver tamanho dos backups
ssh root@72.60.195.200 'du -sh /var/backups/prevendas/*'

# Ver espaço disponível
ssh root@72.60.195.200 'df -h /var/backups'
```

---

## 🚨 Recuperação de Desastre

### Cenário 1: Banco de Dados Corrompido

```bash
# 1. Parar aplicação
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose stop backend frontend'

# 2. Restaurar último backup
cat backup_latest.sql | ssh root@72.60.195.200 'docker exec -i prevendas-db psql -U prevendas sistema_prevendas'

# 3. Reiniciar
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose start backend frontend'
```

### Cenário 2: Servidor Comprometido

```bash
# 1. Provisionar novo servidor
# 2. Executar deploy limpo
./deploy-simple.sh

# 3. Restaurar dados do backup
cat backup_latest.sql | ssh root@NOVO_IP 'docker exec -i prevendas-db psql -U prevendas sistema_prevendas'

# 4. Atualizar DNS
```

### Cenário 3: Perda de Dados Recente

```bash
# Restaurar backup de ponto específico no tempo
cat backup_20250218_140000.sql | ssh root@72.60.195.200 'docker exec -i prevendas-db psql -U prevendas sistema_prevendas'
```

---

## 📦 Backup para Armazenamento Externo

### AWS S3

```bash
# Instalar AWS CLI no servidor
ssh root@72.60.195.200 'apt-get install -y awscli'

# Configurar credenciais
ssh root@72.60.195.200 'aws configure'

# Enviar backup
ssh root@72.60.195.200 'docker exec prevendas-db pg_dump -U prevendas sistema_prevendas | gzip | aws s3 cp - s3://seu-bucket/backups/prevendas_$(date +%Y%m%d).sql.gz'
```

### Google Cloud Storage

```bash
# Instalar gsutil
ssh root@72.60.195.200 'curl https://sdk.cloud.google.com | bash'

# Enviar backup
ssh root@72.60.195.200 'docker exec prevendas-db pg_dump -U prevendas sistema_prevendas | gzip | gsutil cp - gs://seu-bucket/backups/prevendas_$(date +%Y%m%d).sql.gz'
```

### Rsync para Servidor Remoto

```bash
# Sincronizar backups para outro servidor
ssh root@72.60.195.200 'rsync -avz /var/backups/prevendas/ usuario@servidor-backup:/backups/prevendas/'
```

---

## ✅ Checklist de Backup

- [ ] Backup automático configurado (cron)
- [ ] Backups sendo criados diariamente
- [ ] Retenção de backups configurada (7 dias)
- [ ] Backup testado e restauração funciona
- [ ] Backups armazenados em local externo
- [ ] Documentação de recuperação atualizada
- [ ] Equipe treinada em procedimentos de restauração

---

## 📞 Em Caso de Emergência

1. **Não entre em pânico** 🧘
2. **Avalie o problema**: O que foi perdido?
3. **Identifique o backup mais recente**: `ls -lh /var/backups/prevendas/`
4. **Teste a restauração em ambiente isolado** (se possível)
5. **Execute a restauração**
6. **Verifique a integridade dos dados**
7. **Documente o incidente**

---

**Lembre-se**: Um backup não testado é um backup que não existe! 🎯
