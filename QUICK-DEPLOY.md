# 🚀 Deploy Rápido - Hostinger

## Executar Deploy em 1 Comando

```bash
./deploy-simple.sh
```

Isso é tudo! O script vai:
- ✅ Preparar os arquivos
- ✅ Enviar para o servidor
- ✅ Instalar Docker/Docker Compose
- ✅ Configurar SSL (Let's Encrypt)
- ✅ Iniciar a aplicação
- ✅ Executar migrações do banco

## Credenciais do Servidor

- **Host**: 72.60.195.200
- **Usuário**: root
- **Domínio**: prevendas.chorstconsult.com.br

## Após o Deploy

Acesse: **https://prevendas.chorstconsult.com.br**

## Comandos Úteis

```bash
# Ver logs
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs -f'

# Reiniciar
ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose restart'

# Status
ssh root@72.60.195.200 'docker ps'
```

## Problemas?

Veja o guia completo: [DEPLOY-HOSTINGER.md](./DEPLOY-HOSTINGER.md)
