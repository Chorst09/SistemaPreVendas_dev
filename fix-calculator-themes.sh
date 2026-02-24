#!/bin/bash

# Script para corrigir temas das calculadoras
# Substitui backgrounds escuros por light/dark variants

echo "🎨 Corrigindo temas das calculadoras..."

# Diretórios das calculadoras
DIRS=(
  "frontend/src/components/noc-pricing"
  "frontend/src/components/service-desk-pricing"
  "frontend/src/components/printer-outsourcing"
)

# Contador de arquivos modificados
count=0

for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "📁 Processando: $dir"
    
    # Encontrar todos os arquivos .tsx
    find "$dir" -name "*.tsx" -type f | while read -r file; do
      # Backup
      cp "$file" "$file.bak"
      
      # Substituições de backgrounds escuros
      sed -i '' \
        -e 's/bg-slate-800\/50/bg-white dark:bg-gray-900/g' \
        -e 's/bg-slate-800\/30/bg-white dark:bg-gray-900/g' \
        -e 's/bg-slate-800\/40/bg-white dark:bg-gray-900/g' \
        -e 's/bg-slate-800/bg-white dark:bg-gray-900/g' \
        -e 's/bg-slate-900\/50/bg-white dark:bg-gray-900/g' \
        -e 's/bg-slate-900\/30/bg-white dark:bg-gray-900/g' \
        -e 's/bg-slate-900/bg-white dark:bg-gray-900/g' \
        -e 's/bg-gray-800\/50/bg-white dark:bg-gray-900/g' \
        -e 's/bg-gray-800\/30/bg-white dark:bg-gray-900/g' \
        -e 's/bg-gray-800\/40/bg-white dark:bg-gray-900/g' \
        -e 's/bg-gray-900\/50/bg-white dark:bg-gray-900/g' \
        -e 's/bg-gray-900\/30/bg-white dark:bg-gray-900/g' \
        "$file"
      
      # Verificar se houve mudanças
      if ! cmp -s "$file" "$file.bak"; then
        echo "  ✅ Modificado: $(basename $file)"
        ((count++))
        rm "$file.bak"
      else
        # Restaurar se não houve mudanças
        mv "$file.bak" "$file"
      fi
    done
  fi
done

echo ""
echo "✨ Concluído! $count arquivos modificados."
echo ""
echo "🔍 Próximos passos:"
echo "1. Revise as mudanças: git diff"
echo "2. Teste as calculadoras em light/dark mode"
echo "3. Commit: git add -A && git commit -m 'fix: calculator themes'"
