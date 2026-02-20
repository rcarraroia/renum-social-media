from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.leads import LeadCreate, LeadResponse
from app.utils.logger import get_logger
from uuid import uuid4
from datetime import datetime

router = APIRouter()
logger = get_logger(__name__)


@router.post("/leads", response_model=LeadResponse, status_code=201)
async def create_lead(
    lead_data: LeadCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Cria um novo lead na lista de espera
    
    - **activity**: Atividade profissional (consultora, politico, profissional_liberal, educador, fitness, criador, empreendedor, estudante, geral)
    - **app_name**: Nome do app escolhido (SocialFlow, SmartGenius, inFluency)
    - **price**: Faixa de preço escolhida ($29, $49, $99)
    - **price_with_commission**: Faixa de preço com comissão ($29, $49, $99)
    - **name**: Nome completo
    - **email**: Email válido
    - **whatsapp**: WhatsApp em formato internacional (+5511999999999)
    """
    try:
        # Verificar se email já existe
        query = "SELECT id FROM leads WHERE email = :email"
        result = await db.execute(query, {"email": lead_data.email})
        existing_lead = result.fetchone()
        
        if existing_lead:
            logger.warning(f"Lead já existe com email: {lead_data.email}")
            raise HTTPException(
                status_code=409,
                detail="Email já cadastrado na lista de espera"
            )
        
        # Criar novo lead
        lead_id = uuid4()
        created_at = datetime.utcnow()
        
        insert_query = """
            INSERT INTO leads (id, activity, app_name, price, price_with_commission, name, email, whatsapp, created_at)
            VALUES (:id, :activity, :app_name, :price, :price_with_commission, :name, :email, :whatsapp, :created_at)
        """
        
        await db.execute(insert_query, {
            "id": lead_id,
            "activity": lead_data.activity,
            "app_name": lead_data.app_name,
            "price": lead_data.price,
            "price_with_commission": lead_data.price_with_commission,
            "name": lead_data.name,
            "email": lead_data.email,
            "whatsapp": lead_data.whatsapp,
            "created_at": created_at
        })
        
        await db.commit()
        
        logger.info(f"Lead criado com sucesso: {lead_id} - {lead_data.email}")
        
        return LeadResponse(
            id=lead_id,
            activity=lead_data.activity,
            app_name=lead_data.app_name,
            price=lead_data.price,
            price_with_commission=lead_data.price_with_commission,
            name=lead_data.name,
            email=lead_data.email,
            whatsapp=lead_data.whatsapp,
            created_at=created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao criar lead: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Erro ao processar inscrição. Tente novamente."
        )


@router.get("/leads/count")
async def get_leads_count(db: AsyncSession = Depends(get_db)):
    """
    Retorna o número total de leads cadastrados
    """
    try:
        query = "SELECT COUNT(*) as count FROM leads"
        result = await db.execute(query)
        count = result.fetchone()
        
        return {"count": count[0] if count else 0}
        
    except Exception as e:
        logger.error(f"Erro ao contar leads: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao buscar dados"
        )
