#!/usr/bin/env python3
"""
Script de validação de funções e classes importadas
Verifica se todas as funções/classes importadas existem nos módulos
"""
import os
import re
import ast
from pathlib import Path
from typing import List, Dict, Set, Tuple

# Cores
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def extract_definitions(file_path: Path) -> Set[str]:
    """Extrai todas as definições (funções, classes, variáveis) de um arquivo"""
    definitions = set()
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read(), filename=str(file_path))
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                definitions.add(node.name)
            elif isinstance(node, ast.ClassDef):
                definitions.add(node.name)
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        definitions.add(target.id)
    
    except Exception as e:
        print(f"{YELLOW}⚠️  Não foi possível parsear {file_path}: {e}{RESET}")
    
    return definitions

def extract_imports_with_names(file_path: Path) -> List[Tuple[str, List[str], int]]:
    """
    Extrai imports com os nomes específicos importados
    Retorna: [(módulo, [nomes], linha)]
    """
    imports = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                
                # from app.xxx import yyy, zzz
                match = re.match(r'^from\s+(app\.[^\s]+)\s+import\s+(.+)', line)
                if match:
                    module = match.group(1)
                    names_str = match.group(2)
                    
                    # Remover parênteses se houver
                    names_str = names_str.replace('(', '').replace(')', '')
                    
                    # Split por vírgula e limpar
                    names = [n.strip().split(' as ')[0] for n in names_str.split(',')]
                    
                    imports.append((module, names, line_num))
    
    except Exception as e:
        print(f"{RED}Erro ao ler {file_path}: {e}{RESET}")
    
    return imports

def module_to_file_path(module: str, base_dir: str = "app") -> Path:
    """Converte nome de módulo para caminho de arquivo"""
    if module.startswith('app.'):
        module = module[4:]
    
    parts = module.split('.')
    file_path = Path(base_dir) / '/'.join(parts)
    
    if file_path.with_suffix('.py').exists():
        return file_path.with_suffix('.py')
    
    if (file_path / '__init__.py').exists():
        return file_path / '__init__.py'
    
    return None

def validate_function_imports(directory: str = "app") -> List[str]:
    """Valida se todas as funções/classes importadas existem"""
    errors = []
    
    print(f"{BLUE}🔍 Validando funções e classes importadas...{RESET}\n")
    
    python_files = list(Path(directory).rglob("*.py"))
    
    for file_path in python_files:
        imports = extract_imports_with_names(file_path)
        
        if not imports:
            continue
        
        has_errors = False
        
        for module, names, line_num in imports:
            # Pular imports de bibliotecas externas que começam com app mas não são do projeto
            module_path = module_to_file_path(module, directory)
            
            if module_path is None:
                continue  # Já foi validado pelo outro script
            
            # Extrair definições do módulo
            definitions = extract_definitions(module_path)
            
            # Verificar se cada nome importado existe
            for name in names:
                if name == '*':
                    continue  # Import * não pode ser validado
                
                if name not in definitions:
                    if not has_errors:
                        print(f"📄 {file_path}")
                        has_errors = True
                    
                    error_msg = f"  {RED}❌ Linha {line_num}: '{name}' não encontrado em {module}{RESET}"
                    print(error_msg)
                    errors.append(f"{file_path}:{line_num} - {name} não existe em {module}")
        
        if has_errors:
            print()
    
    return errors

def main():
    """Função principal"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  VALIDAÇÃO DE FUNÇÕES/CLASSES - BACKEND RENUM{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    errors = validate_function_imports("app")
    
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  RESULTADO DA VALIDAÇÃO{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    if errors:
        print(f"{RED}❌ ERROS ENCONTRADOS: {len(errors)}{RESET}\n")
        for error in errors:
            print(f"  {RED}•{RESET} {error}")
        print()
        return 1
    else:
        print(f"{GREEN}✅ NENHUM ERRO ENCONTRADO!{RESET}\n")
        print(f"{GREEN}Todas as funções/classes importadas existem.{RESET}\n")
        return 0

if __name__ == "__main__":
    exit(main())
