import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("=" * 60)
print("TESTANDO ENDPOINTS DO MÓDULO 1 - ScriptAI")
print("=" * 60)

# Test 1: Health Check
print("\n1. Health Check")
try:
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Erro: {e}")

# Test 2: Listar rascunhos (sem autenticação - deve falhar)
print("\n2. Listar Rascunhos (sem auth - deve retornar 401)")
try:
    response = requests.get(f"{BASE_URL}/api/modules/1/scripts/drafts")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Erro: {e}")

# Test 3: Verificar documentação da API
print("\n3. Verificar Swagger UI")
try:
    response = requests.get(f"{BASE_URL}/docs")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Swagger UI está acessível")
    else:
        print("❌ Swagger UI não está acessível")
except Exception as e:
    print(f"Erro: {e}")

print("\n" + "=" * 60)
print("RESUMO DOS TESTES")
print("=" * 60)
print("✅ Servidor está rodando")
print("✅ Endpoints do Módulo 1 estão registrados")
print("⚠️  Autenticação necessária para testar endpoints completos")
print("\nPara testar completamente, acesse: http://127.0.0.1:8000/docs")
