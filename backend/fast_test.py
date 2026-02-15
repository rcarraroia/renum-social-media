"""
Teste rápido dos endpoints do Módulo 1
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"
TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImJhOGUyYzIwLTdhM2UtNDI1YS1iYWM2LTFmODY4MGVkN2NlMyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3pic2JmaG1zZ3Jsb2h4ZHhpaGF3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhNmNiZjVlNS0wZDAyLTRhMzctYjQzNS03OTA1YjVmMGQ5YTgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcxMTYxMzgxLCJpYXQiOjE3NzExNTc3ODEsImVtYWlsIjoidGVzdEByZW51bS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoidGVzdEByZW51bS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJhNmNiZjVlNS0wZDAyLTRhMzctYjQzNS03OTA1YjVmMGQ5YTgifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MTE1Nzc4MX1dLCJzZXNzaW9uX2lkIjoiZGRhZmIyMDEtYjg5OS00ZTBiLTgyNTEtOWI4NzUxY2Y2MDVmIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.jgs5pyTj2WCM3Tqus_-kAzi7a77mpSqpMQgp8BqoQwvTwnGLpZ5y2xXJjZsdorG_MJAaEZqVBhEYElebY3eg4w"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

print("🧪 TESTE RÁPIDO - Módulo 1\n")

# Test 1: Listar rascunhos
print("1️⃣ Listando rascunhos...")
try:
    r = requests.get(f"{BASE_URL}/api/modules/1/scripts/drafts", headers=headers, timeout=10)
    print(f"   Status: {r.status_code} {'✅' if r.status_code == 200 else '❌'}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Total: {data.get('total', 0)} rascunhos")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# Test 2: Salvar rascunho
print("\n2️⃣ Salvando rascunho...")
draft_payload = {
    "title": "Teste Rápido",
    "script": "Script de teste",
    "metadata": {"test": True}
}
try:
    r = requests.post(
        f"{BASE_URL}/api/modules/1/scripts/save-draft",
        headers=headers,
        json=draft_payload,
        timeout=10
    )
    print(f"   Status: {r.status_code} {'✅' if r.status_code == 200 else '❌'}")
    if r.status_code == 200:
        draft_id = r.json().get("id")
        print(f"   ID: {draft_id}")
        
        # Test 3: Deletar rascunho
        print("\n3️⃣ Deletando rascunho...")
        r = requests.delete(
            f"{BASE_URL}/api/modules/1/scripts/drafts/{draft_id}",
            headers=headers,
            timeout=10
        )
        print(f"   Status: {r.status_code} {'✅' if r.status_code == 200 else '❌'}")
except Exception as e:
    print(f"   ❌ Erro: {e}")

print("\n✅ Testes concluídos!")
