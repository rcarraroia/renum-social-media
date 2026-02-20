#!/usr/bin/env python3
"""
Script de validação de imports do backend
Verifica se todos os módulos importados existem
"""
import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Set

# Cores para output
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def find_python_files(directory: str) -> List[Path]:
    """Encontra todos os arquivos Python no diretório"""
    return list(Path(directory).rglob("*.py"))

def extract_imports(file_path: Path) -> List[Tuple[str, int]]:
    """Extrai todos os imports de um arquivo Python"""
    imports = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                # Ignorar comentários
                if line.startswith('#'):
                    continue
                
                # Match: from app.xxx import yyy
                match = re.match(r'^from\s+(app\.[^\s]+)\s+import', line)
                if match:
                    imports.append((match.group(1), line_num))
                
                # Match: import app.xxx
                match = re.match(r'^import\s+(app\.[^\s]+)', line)
                if match:
                    imports.append((match.group(1), line_num))
    
    except Exception as e:
        print(f"{RED}Erro ao ler {file_path}: {e}{RESET}")
    
    return imports

def module_to_file_path(module: str, base_dir: str = "app") -> Path:
    """Converte nome de módulo para caminho de arquivo"""
    # Remove 'app.' do início
    if module.startswith('app.'):
        module = module[4:]
    
    # Converte pontos em barras
    parts = module.split('.')
    
    # Tenta encontrar o arquivo
    # Pode ser um arquivo .py ou um diretório com __init__.py
    file_path = Path(base_dir) / '/'.join(parts)
    
    # Verifica se é um arquivo .py
    if file_path.with_suffix('.py').exists():
        return file_path.with_suffix('.py')
    
    # Verifica se é um diretório com __init__.py
    if (file_path / '__init__.py').exists():
        return file_path / '__init__.py'
    
    return None

def validate_imports(directory: str = "app") -> Tuple[List[str], List[str]]:
    """Valida todos os imports do projeto"""
    errors = []
    warnings = []
    checked_modules = set()
    
    print(f"{BLUE}🔍 Analisando imports no diretório: {directory}{RESET}\n")
    
    python_files = find_python_files(directory)
    print(f"📁 Encontrados {len(python_files)} arquivos Python\n")
    
    for file_path in python_files:
        imports = extract_imports(file_path)
        
        if not imports:
            continue
        
        print(f"📄 {file_path}")
        
        for module, line_num in imports:
            if module in checked_modules:
                continue
            
            checked_modules.add(module)
            
            # Verifica se o módulo existe
            module_path = module_to_file_path(module, directory)
            
            if module_path is None:
                error_msg = f"  {RED}❌ Linha {line_num}: {module} → Arquivo não encontrado{RESET}"
                print(error_msg)
                errors.append(f"{file_path}:{line_num} - {module}")
            else:
                print(f"  {GREEN}✓{RESET} {module}")
        
        print()
    
    return errors, warnings

def main():
    """Função principal"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  VALIDAÇÃO DE IMPORTS - BACKEND RENUM{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    # Mudar para o diretório backend
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    errors, warnings = validate_imports("app")
    
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  RESULTADO DA VALIDAÇÃO{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    if errors:
        print(f"{RED}❌ ERROS ENCONTRADOS: {len(errors)}{RESET}\n")
        for error in errors:
            print(f"  {RED}•{RESET} {error}")
        print()
        sys.exit(1)
    else:
        print(f"{GREEN}✅ NENHUM ERRO ENCONTRADO!{RESET}\n")
        print(f"{GREEN}Todos os imports estão corretos.{RESET}\n")
        sys.exit(0)

if __name__ == "__main__":
    main()
