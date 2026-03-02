#!/bin/bash

# Script de Restauração do Banco de Dados
# Uso: ./scripts/restore-database.sh <ARQUIVO_BACKUP> [SERVIDOR]
# Exemplo: ./scripts/restore-database.sh backups/backup_20260225_115000.sql.gz root@72.60.195.201

set -e

if [ -z "$1" ]; then
    echo "Erro: Arquivo de backup não especificado"
    echo "Uso: $0 <ARQUIVO_BACKUP> [SERVIDOR]"
    exit 1
fi

BACKUP_FILE=$1
SERVER=$2

# Verificar se arquivo existe
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Erro: Arquivo ${BACKUP_FILE} não encontrado"
    exit 1
fi

# Descomprimir se necessário
if [[ ${BACKUP_FILE} == *.gz ]]; then
    echo "Descomprimindo arquivo..."
    gunzip -c ${BACKUP_FILE} > /tmp/backup_temp.sql
    BACKUP_FILE="/tmp/backup_temp.sql"
fi

echo "Restaurando banco de dados..."
echo "Arquivo: ${BACKUP_FILE}"

if [ -z "${SERVER}" ]; then
    # Restauração local
    echo "Restaurando localmente..."
    docker exec -i prevendas-db psql -U prevendas sistema_prevendas < ${BACKUP_FILE}
else
    # Restauração remota
    echo "Restaurando em ${SERVER}..."
    cat ${BACKUP_FILE} | ssh ${SERVER} "docker exec -i prevendas-db psql -U prevendas sistema_prevendas"
fi

# Limpar arquivo temporário
if [ -f "/tmp/backup_temp.sql" ]; then
    rm /tmp/backup_temp.sql
fi

echo ""
echo "✓ Restauração concluída!"
echo "  Data: $(date)"
