#!/bin/bash

# Script de Backup do Banco de Dados
# Uso: ./scripts/backup-database.sh [SERVIDOR]
# Exemplo: ./scripts/backup-database.sh root@72.60.195.200

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Criar diretório de backups
mkdir -p ${BACKUP_DIR}

if [ -z "$1" ]; then
    # Backup local
    echo "Fazendo backup local do banco de dados..."
    docker exec prevendas-db pg_dump -U prevendas sistema_prevendas > ${BACKUP_FILE}
else
    # Backup remoto
    SERVER=$1
    echo "Fazendo backup remoto do banco de dados em ${SERVER}..."
    ssh ${SERVER} "docker exec prevendas-db pg_dump -U prevendas sistema_prevendas" > ${BACKUP_FILE}
fi

# Comprimir backup
gzip ${BACKUP_FILE}
BACKUP_FILE="${BACKUP_FILE}.gz"

# Informações do backup
SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
echo ""
echo "✓ Backup concluído!"
echo "  Arquivo: ${BACKUP_FILE}"
echo "  Tamanho: ${SIZE}"
echo "  Data: $(date)"
echo ""
echo "Para restaurar:"
echo "  gunzip ${BACKUP_FILE}"
echo "  docker exec -i prevendas-db psql -U prevendas sistema_prevendas < backup_${TIMESTAMP}.sql"
