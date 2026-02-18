# ✅ Checklist Pré-Deploy

Antes de executar o deploy, verifique:

## 🌐 DNS e Domínio

- [ ] Subdomínio `prevendas.chorstconsult.com.br` está apontando para `72.60.195.200`
- [ ] DNS propagado (teste com `nslookup prevendas.chorstconsult.com.br`)

## 🔐 Acesso SSH

- [ ] Consegue conectar via SSH: `ssh root@72.60.195.200`
- [ ] Senha funciona: `raizCh@#horst1977#@`

## 💻 Servidor

- [ ] Porta 80 (HTTP) está aberta
- [ ] Porta 443 (HTTPS) está aberta
- [ ] Porta 5432 (PostgreSQL) disponível internamente

## 📦 Código Local

- [ ] Todas as alterações commitadas
- [ ] Build local funciona: `cd frontend && npm run build`
- [ ] Backend compila: `cd backend && npm run build`

## 🔧 Configurações

- [ ] Variáveis de ambiente revisadas
- [ ] Senha do banco segura (definida no script)
- [ ] CORS configurado corretamente

## 🚀 Pronto para Deploy!

Execute:

```bash
./deploy-simple.sh
```

## ⏱️ Tempo Estimado

- **Primeira vez**: ~10-15 minutos
- **Atualizações**: ~3-5 minutos

## 📞 Em Caso de Problemas

1. Verifique os logs: `ssh root@72.60.195.200 'cd /var/www/prevendas && docker-compose logs'`
2. Consulte: [DEPLOY-HOSTINGER.md](./DEPLOY-HOSTINGER.md)
3. Seção de troubleshooting no guia completo
