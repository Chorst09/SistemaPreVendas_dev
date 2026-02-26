# Como Limpar o Cache do Navegador

## ✅ Deploy Concluído

O sistema foi atualizado com as correções de tema. O arquivo `globals.css` foi reconstruído com:

- **Dark Mode (padrão)**: Fundo escuro, textos claros
- **Light Mode**: Fundo branco, textos MUITO escuros (220 45% 10%)

## 🔄 Problema: Cache do Navegador

O navegador está mostrando a versão antiga porque está usando cache. Você precisa forçar o navegador a baixar os novos arquivos.

## 🛠️ Soluções

### Opção 1: Hard Refresh (Recomendado)

**Mac:**
```
Cmd + Shift + R
```

**Windows/Linux:**
```
Ctrl + Shift + R
```

ou

```
Ctrl + F5
```

### Opção 2: Limpar Cache Manualmente

#### Chrome/Edge
1. Abra DevTools: `F12` ou `Cmd+Option+I` (Mac)
2. Clique com botão direito no ícone de refresh
3. Selecione "Limpar cache e recarregar forçadamente"

#### Firefox
1. Abra DevTools: `F12`
2. Clique com botão direito no ícone de refresh
3. Selecione "Limpar cache e recarregar"

#### Safari
1. Vá em Safari > Preferências > Avançado
2. Marque "Mostrar menu Desenvolver"
3. Menu Desenvolver > Limpar Caches
4. Recarregue a página

### Opção 3: Modo Anônimo/Privado

Abra o site em uma janela anônima/privada:
- **Chrome**: `Cmd+Shift+N` (Mac) ou `Ctrl+Shift+N` (Windows)
- **Firefox**: `Cmd+Shift+P` (Mac) ou `Ctrl+Shift+P` (Windows)
- **Safari**: `Cmd+Shift+N`

### Opção 4: Limpar Todo o Cache do Site

#### Chrome/Edge
1. Abra DevTools (`F12`)
2. Vá em Application > Storage
3. Clique em "Clear site data"
4. Recarregue a página

#### Firefox
1. `Cmd+Shift+Delete` (Mac) ou `Ctrl+Shift+Delete` (Windows)
2. Selecione "Cache"
3. Período: "Tudo"
4. Clique em "Limpar agora"

## ✅ Verificação

Após limpar o cache:

1. Acesse: https://prevendas.chorstconsult.com.br
2. Alterne para **modo claro** (botão no header)
3. Os textos devem estar **MUITO ESCUROS** (quase preto)
4. Navegue pelos módulos:
   - Dashboard
   - Service Desk
   - NOC Pricing
   - AI Bid Analyzer
5. Todos os textos devem ter alto contraste

## 🔍 Como Confirmar que o Cache Foi Limpo

1. Abra DevTools (`F12`)
2. Vá na aba "Network"
3. Recarregue a página
4. Procure por `globals.css` ou arquivos `.css`
5. Verifique se o status é `200` (não `304 Not Modified`)
6. Verifique se "Size" mostra o tamanho real (não "disk cache")

## 📊 Informações Técnicas

### Arquivo Atualizado
- `frontend/src/app/globals.css`

### Variáveis CSS (Modo Claro)
```css
.light {
  --foreground: 220 45% 10%;       /* Texto principal MUITO escuro */
  --card-foreground: 220 45% 10%;  /* Texto dos cards MUITO escuro */
  --muted-foreground: 220 15% 35%; /* Texto muted mais escuro */
}
```

### Build Info
- **Data**: 25/02/2026 11:35 GMT
- **Container**: prevendas-frontend (a6c8d8ab585d)
- **Imagem**: prevendas-frontend:latest
- **Build Time**: 97s

## 🚨 Se Ainda Não Funcionar

1. **Verifique o tema ativo**:
   - Abra DevTools > Elements
   - Procure pela tag `<html>`
   - Deve ter `class="light"` quando em modo claro
   - Deve ter `class="dark"` quando em modo escuro

2. **Verifique as variáveis CSS**:
   - DevTools > Elements > Computed
   - Procure por `--foreground`
   - Modo claro deve mostrar: `hsl(220 45% 10%)`

3. **Teste em outro navegador**:
   - Se funcionar em outro navegador, é definitivamente cache

4. **Aguarde propagação do CDN** (se aplicável):
   - Alguns CDNs podem levar até 5-10 minutos

## 📝 Comandos Úteis (Servidor)

```bash
# Ver logs do container
ssh root@72.60.195.200 'docker logs -f prevendas-frontend'

# Reiniciar container
ssh root@72.60.195.200 'docker restart prevendas-frontend'

# Verificar status
ssh root@72.60.195.200 'docker ps | grep prevendas'
```

## ✅ Confirmação Final

Quando o cache for limpo corretamente, você verá:

- ✅ Modo escuro: Fundo escuro, textos claros (como antes)
- ✅ Modo claro: Fundo branco, textos MUITO escuros (quase preto)
- ✅ Alto contraste em ambos os modos
- ✅ Todos os labels e textos legíveis

---

**Última Atualização**: 25/02/2026 11:40 GMT  
**Status**: Deploy concluído, aguardando limpeza de cache do navegador
