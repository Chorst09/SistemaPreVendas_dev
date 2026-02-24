#!/bin/bash

# Script para corrigir temas em todos os arquivos do Service Desk

echo "🎨 Corrigindo temas em todos os componentes..."

# Diretório base
BASE_DIR="frontend/src/components/service-desk-pricing"

# Função para aplicar correções em um arquivo
fix_file() {
    local file="$1"
    echo "  Corrigindo: $file"
    
    # Alerts Azuis
    sed -i '' 's/className="bg-blue-50 border-blue-200"/className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"/g' "$file"
    sed -i '' 's/className="border-blue-200 bg-blue-50"/className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"/g' "$file"
    
    # Alerts Verdes
    sed -i '' 's/className="bg-green-50 border-green-200"/className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"/g' "$file"
    sed -i '' 's/className="border-green-200 bg-green-50"/className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"/g' "$file"
    
    # Alerts Amarelos
    sed -i '' 's/className="bg-yellow-50 border-yellow-200"/className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"/g' "$file"
    sed -i '' 's/className="border-yellow-200 bg-yellow-50"/className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"/g' "$file"
    
    # Alerts Vermelhos
    sed -i '' 's/className="bg-red-50 border-red-200"/className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"/g' "$file"
    sed -i '' 's/className="border-red-200 bg-red-50"/className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"/g' "$file"
    
    # Textos em Alerts
    sed -i '' 's/text-blue-900"/text-blue-900 dark:text-blue-100"/g' "$file"
    sed -i '' 's/text-blue-800"/text-blue-800 dark:text-blue-200"/g' "$file"
    sed -i '' 's/text-green-900"/text-green-900 dark:text-green-100"/g' "$file"
    sed -i '' 's/text-green-800"/text-green-800 dark:text-green-200"/g' "$file"
    sed -i '' 's/text-yellow-900"/text-yellow-900 dark:text-yellow-100"/g' "$file"
    sed -i '' 's/text-yellow-800"/text-yellow-800 dark:text-yellow-200"/g' "$file"
    sed -i '' 's/text-red-900"/text-red-900 dark:text-red-100"/g' "$file"
    sed -i '' 's/text-red-800"/text-red-800 dark:text-red-200"/g' "$file"
    
    # Ícones
    sed -i '' 's/text-blue-600"/text-blue-600 dark:text-blue-400"/g' "$file"
    sed -i '' 's/text-green-600"/text-green-600 dark:text-green-400"/g' "$file"
    sed -i '' 's/text-yellow-600"/text-yellow-600 dark:text-yellow-400"/g' "$file"
    sed -i '' 's/text-red-600"/text-red-600 dark:text-red-400"/g' "$file"
    sed -i '' 's/text-orange-600"/text-orange-600 dark:text-orange-400"/g' "$file"
}

# Encontrar e corrigir todos os arquivos .tsx
find "$BASE_DIR" -name "*.tsx" -type f | while read file; do
    fix_file "$file"
done

echo "✅ Correção concluída!"
echo "📝 Execute 'git diff' para ver as mudanças"
