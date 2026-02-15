"""
Teste simples para validar os modelos Pydantic de social_accounts.

Este teste valida:
- Enum SocialPlatform contém exatamente 6 plataformas
- Modelos podem ser instanciados corretamente
- Validações Pydantic funcionam conforme esperado

Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
"""

from datetime import datetime, timedelta
from pydantic import ValidationError
from app.models.social_accounts import (
    SocialPlatform,
    ConnectRequest,
    PlatformStatus,
    SocialAccountsResponse,
    CalendarQuery,
    CalendarPost,
    CalendarResponse,
    RescheduleRequest,
    DashboardStats,
)

print("🧪 TESTE - Modelos Pydantic Social Accounts\n")

# Test 1: Enum SocialPlatform
print("1️⃣ Testando enum SocialPlatform...")
try:
    platforms = list(SocialPlatform)
    assert len(platforms) == 6, f"Esperado 6 plataformas, encontrado {len(platforms)}"
    expected = {"instagram", "tiktok", "linkedin", "facebook", "x", "youtube"}
    actual = {p.value for p in platforms}
    assert actual == expected, f"Plataformas incorretas: {actual}"
    print("   ✅ Enum contém exatamente 6 plataformas corretas")
except AssertionError as e:
    print(f"   ❌ Erro: {e}")
except Exception as e:
    print(f"   ❌ Erro inesperado: {e}")

# Test 2: ConnectRequest
print("\n2️⃣ Testando ConnectRequest...")
try:
    request = ConnectRequest(platform=SocialPlatform.INSTAGRAM)
    assert request.platform == SocialPlatform.INSTAGRAM
    print("   ✅ ConnectRequest criado com sucesso")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# Test 3: PlatformStatus
print("\n3️⃣ Testando PlatformStatus...")
try:
    status = PlatformStatus(
        platform=SocialPlatform.TIKTOK,
        connected=True,
        account_name="@teste"
    )
    assert status.connected == True
    assert status.account_name == "@teste"
    print("   ✅ PlatformStatus criado com sucesso")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# Test 4: SocialAccountsResponse com validação
print("\n4️⃣ Testando SocialAccountsResponse...")
try:
    # Criar status para todas as 6 plataformas
    accounts = [
        PlatformStatus(platform=p, connected=False, account_name=None)
        for p in SocialPlatform
    ]
    response = SocialAccountsResponse(accounts=accounts)
    assert len(response.accounts) == 6
    print("   ✅ SocialAccountsResponse com todas as plataformas")
    
    # Testar validação: deve falhar com menos de 6 plataformas
    try:
        invalid_response = SocialAccountsResponse(accounts=accounts[:3])
        print("   ❌ Validação deveria ter falhado com menos de 6 plataformas")
    except ValidationError:
        print("   ✅ Validação correta: rejeita menos de 6 plataformas")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# Test 5: CalendarQuery com validação de datas
print("\n5️⃣ Testando CalendarQuery...")
try:
    now = datetime.now()
    future = now + timedelta(days=7)
    
    query = CalendarQuery(
        start_date=now,
        end_date=future,
        platform=SocialPlatform.INSTAGRAM,
        status="scheduled"
    )
    assert query.platform == SocialPlatform.INSTAGRAM
    print("   ✅ CalendarQuery criado com sucesso")
    
    # Testar validação: end_date antes de start_date deve falhar
    try:
        invalid_query = CalendarQuery(
            start_date=future,
            end_date=now
        )
        print("   ❌ Validação deveria ter falhado com end_date < start_date")
    except ValidationError:
        print("   ✅ Validação correta: rejeita end_date < start_date")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# Test 6: CalendarPost
print("\n6️⃣ Testando CalendarPost...")
try:
    now = datetime.now()
    post = CalendarPost(
        id="test-123",
        content="Post de teste",
        platform=SocialPlatform.LINKEDIN,
        scheduled_at=now + timedelta(days=1),
        status="scheduled",
        thumbnail_url="https://example.com/thumb.jpg",
        metricool_post_id="mtc-456",
        created_at=now,
        cancelled_at=None
    )
    assert post.platform == SocialPlatform.LINKEDIN
    assert post.thumbnail_url.startswith("https://")
    print("   ✅ CalendarPost criado com sucesso")
    
    # Testar validação: thumbnail_url sem https:// deve falhar
    try:
        invalid_post = CalendarPost(
            id="test-456",
            content="Post inválido",
            platform=SocialPlatform.FACEBOOK,
            scheduled_at=now + timedelta(days=1),
            status="scheduled",
            thumbnail_url="http://example.com/thumb.jpg",  # http em vez de https
            created_at=now
        )
        print("   ❌ Validação deveria ter falhado com thumbnail_url sem https://")
    except ValidationError:
        print("   ✅ Validação correta: rejeita thumbnail_url sem https://")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# Test 7: CalendarResponse
print("\n7️⃣ Testando CalendarResponse...")
try:
    now = datetime.now()
    posts = [
        CalendarPost(
            id=f"post-{i}",
            content=f"Post {i}",
            platform=SocialPlatform.INSTAGRAM,
            scheduled_at=now + timedelta(days=i),
            status="scheduled",
            created_at=now
        )
        for i in range(3)
    ]
    response = CalendarResponse(posts=posts, total=10)
    assert len(response.posts) == 3
    assert response.total == 10
    print("   ✅ CalendarResponse criado com sucesso")
    
    # Testar validação: total < len(posts) deve falhar
    try:
        invalid_response = CalendarResponse(posts=posts, total=1)
        print("   ❌ Validação deveria ter falhado com total < len(posts)")
    except ValidationError:
        print("   ✅ Validação correta: rejeita total < len(posts)")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# Test 8: RescheduleRequest com validação de data futura
print("\n8️⃣ Testando RescheduleRequest...")
try:
    future = datetime.now() + timedelta(days=7)
    request = RescheduleRequest(scheduled_at=future)
    assert request.scheduled_at > datetime.now()
    print("   ✅ RescheduleRequest criado com sucesso")
    
    # Testar validação: data no passado deve falhar
    try:
        past = datetime.now() - timedelta(days=1)
        invalid_request = RescheduleRequest(scheduled_at=past)
        print("   ❌ Validação deveria ter falhado com data no passado")
    except ValidationError:
        print("   ✅ Validação correta: rejeita data no passado")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# Test 9: DashboardStats
print("\n9️⃣ Testando DashboardStats...")
try:
    stats = DashboardStats(
        videos_total=127,
        posts_scheduled_month=18,
        posts_published_month=24,
        engagement_total=15420,
        connected_platforms=[SocialPlatform.INSTAGRAM, SocialPlatform.TIKTOK]
    )
    assert stats.videos_total == 127
    assert len(stats.connected_platforms) == 2
    print("   ✅ DashboardStats criado com sucesso")
    
    # Testar validação: valores negativos devem falhar
    try:
        invalid_stats = DashboardStats(
            videos_total=-1,
            posts_scheduled_month=0,
            posts_published_month=0,
            engagement_total=0,
            connected_platforms=[]
        )
        print("   ❌ Validação deveria ter falhado com valores negativos")
    except ValidationError:
        print("   ✅ Validação correta: rejeita valores negativos")
    
    # Testar validação: plataformas duplicadas devem falhar
    try:
        invalid_stats = DashboardStats(
            videos_total=10,
            posts_scheduled_month=5,
            posts_published_month=3,
            engagement_total=100,
            connected_platforms=[SocialPlatform.INSTAGRAM, SocialPlatform.INSTAGRAM]
        )
        print("   ❌ Validação deveria ter falhado com plataformas duplicadas")
    except ValidationError:
        print("   ✅ Validação correta: rejeita plataformas duplicadas")
except Exception as e:
    print(f"   ❌ Erro: {e}")

print("\n✅ Todos os testes de modelos concluídos!")
