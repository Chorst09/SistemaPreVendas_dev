#!/usr/bin/env python3
"""
Script para adicionar bg-card em todos os Cards sem className
"""

import re
import os
from pathlib import Path

# Diretórios das calculadoras
DIRS = [
    "frontend/src/components/noc-pricing",
    "frontend/src/components/service-desk-pricing",
    "frontend/src/components/printer-outsourcing",
]

def fix_card_backgrounds(file_path):
    """Adiciona className='bg-card' em Cards sem className"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Padrão 1: <Card> sem nenhum atributo
    content = re.sub(
        r'<Card>',
        r'<Card className="bg-card">',
        content
    )
    
    # Padrão 2: <Card com outros atributos mas sem className
    # Procura por <Card seguido de espaço e atributos, mas não className
    def add_classname(match):
        tag = match.group(0)
        if 'className' not in tag:
            # Adiciona className logo após <Card
            return tag.replace('<Card ', '<Card className="bg-card" ')
        return tag
    
    # Encontra <Card com atributos mas sem className
    content = re.sub(
        r'<Card\s+(?![^>]*className)[^>]*>',
        add_classname,
        content
    )
    
    return content, content != original_content

def main():
    total_files = 0
    modified_files = 0
    
    for dir_path in DIRS:
        if not os.path.exists(dir_path):
            print(f"⚠️  Diretório não encontrado: {dir_path}")
            continue
        
        print(f"\n📁 Processando: {dir_path}")
        
        # Encontra todos os arquivos .tsx
        for tsx_file in Path(dir_path).rglob("*.tsx"):
            total_files += 1
            
            new_content, was_modified = fix_card_backgrounds(str(tsx_file))
            
            if was_modified:
                # Salva o arquivo modificado
                with open(tsx_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f"  ✅ Modificado: {tsx_file.name}")
                modified_files += 1
    
    print(f"\n✨ Concluído!")
    print(f"📊 Total de arquivos: {total_files}")
    print(f"✏️  Arquivos modificados: {modified_files}")
    print(f"\n🔍 Próximos passos:")
    print(f"1. Revise as mudanças: git diff")
    print(f"2. Teste as calculadoras")
    print(f"3. Commit: git add -A && git commit -m 'fix: add bg-card to all Cards'")

if __name__ == "__main__":
    main()
