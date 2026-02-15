import requests
import json

TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImJhOGUyYzIwLTdhM2UtNDI1YS1iYWM2LTFmODY4MGVkN2NlMyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3pic2JmaG1zZ3Jsb2h4ZHhpaGF3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJhNmNiZjVlNS0wZDAyLTRhMzctYjQzNS03OTA1YjVmMGQ5YTgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcxMTYxMzgxLCJpYXQiOjE3NzExNTc3ODEsImVtYWlsIjoidGVzdEByZW51bS5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoidGVzdEByZW51bS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJhNmNiZjVlNS0wZDAyLTRhMzctYjQzNS03OTA1YjVmMGQ5YTgifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3MTE1Nzc4MX1dLCJzZXNzaW9uX2lkIjoiZGRhZmIyMDEtYjg5OS00ZTBiLTgyNTEtOWI4NzUxY2Y2MDVmIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.jgs5pyTj2WCM3Tqus_-kAzi7a77mpSqpMQgp8BqoQwvTwnGLpZ5y2xXJjZsdorG_MJAaEZqVBhEYElebY3eg4w"

print("Testando health...")
r = requests.get("http://127.0.0.1:8000/health", timeout=5)
print(f"Health: {r.status_code}")

print("\nTestando drafts com timeout de 10s...")
try:
    r = requests.get(
        "http://127.0.0.1:8000/api/modules/1/scripts/drafts",
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=10
    )
    print(f"Status: {r.status_code}")
    print(f"Response: {json.dumps(r.json(), indent=2)}")
except requests.Timeout:
    print("❌ TIMEOUT - Endpoint travou!")
except Exception as e:
    print(f"❌ Erro: {e}")
