"""
Script para gerar token de teste para autenticação na API
"""
import asyncio
from supabase import create_client
from app.config import settings

async def create_test_user_and_token():
    """Cria usuário de teste e retorna token de acesso"""
    
    # Conectar ao Supabase
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    
    print("=" * 60)
    print("GERANDO TOKEN DE TESTE")
    print("=" * 60)
    
    # Email e senha de teste
    test_email = "test@renum.com"
    test_password = "Test123!@#"
    
    try:
        # Tentar criar usuário (se já existir, vai falhar mas tudo bem)
        print(f"\n1. Criando usuário de teste: {test_email}")
        auth_response = supabase.auth.sign_up({
            "email": test_email,
            "password": test_password
        })
        print(f"✅ Usuário criado: {auth_response.user.id if auth_response.user else 'N/A'}")
    except Exception as e:
        print(f"⚠️  Usuário já existe ou erro: {e}")
    
    # Fazer login para obter token
    print(f"\n2. Fazendo login para obter token...")
    try:
        login_response = supabase.auth.sign_in_with_password({
            "email": test_email,
            "password": test_password
        })
        
        if login_response.session:
            access_token = login_response.session.access_token
            user_id = login_response.user.id
            
            print(f"✅ Login bem-sucedido!")
            print(f"\nUser ID: {user_id}")
            print(f"\n{'=' * 60}")
            print("TOKEN DE ACESSO (copie e cole no Swagger):")
            print(f"{'=' * 60}")
            print(f"\nBearer {access_token}")
            print(f"\n{'=' * 60}")
            
            # Verificar se usuário tem organização
            print(f"\n3. Verificando organização do usuário...")
            org_response = supabase.table("users").select("organization_id").eq("id", user_id).execute()
            
            if org_response.data and len(org_response.data) > 0:
                org_id = org_response.data[0].get("organization_id")
                print(f"✅ Organização encontrada: {org_id}")
            else:
                print(f"⚠️  Usuário não tem organização associada")
                print(f"   Você pode precisar criar uma organização manualmente")
            
            return access_token
        else:
            print("❌ Erro ao fazer login - sem sessão")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao fazer login: {e}")
        return None

if __name__ == "__main__":
    token = asyncio.run(create_test_user_and_token())
    
    if token:
        print("\n" + "=" * 60)
        print("INSTRUÇÕES PARA USAR NO SWAGGER UI")
        print("=" * 60)
        print("\n1. Acesse: http://127.0.0.1:8000/docs")
        print("2. Clique no botão 'Authorize' (cadeado verde)")
        print("3. Cole o token acima (com 'Bearer ' na frente)")
        print("4. Clique em 'Authorize' e depois 'Close'")
        print("5. Agora você pode testar todos os endpoints!")
        print("\n" + "=" * 60)
