"""
Models para o sistema de leads (lista de espera)
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Literal
from uuid import UUID
import re


class LeadCreate(BaseModel):
    """
    Schema para criação de novo lead
    """
    activity: Literal[
        "consultora",
        "politico",
        "profissional_liberal",
        "educador",
        "fitness",
        "criador",
        "empreendedor",
        "estudante",
        "geral"
    ] = Field(..., description="Atividade profissional do lead")
    
    app_name: Literal["SocialFlow", "SmartGenius", "inFluency"] = Field(
        ...,
        description="Nome do app escolhido"
    )
    
    price: Literal["$29", "$49", "$99"] = Field(
        ...,
        description="Faixa de preço escolhida"
    )
    
    price_with_commission: Literal["$29", "$49", "$99"] = Field(
        ...,
        description="Faixa de preço com comissão"
    )
    
    name: str = Field(..., min_length=2, max_length=100, description="Nome completo")
    
    email: EmailStr = Field(..., description="Email válido")
    
    whatsapp: str = Field(
        ...,
        min_length=10,
        max_length=20,
        description="WhatsApp em formato internacional (+5511999999999)"
    )
    
    @field_validator("whatsapp")
    @classmethod
    def validate_whatsapp(cls, v: str) -> str:
        """Valida formato do WhatsApp"""
        # Remove espaços e caracteres especiais
        cleaned = re.sub(r'[^\d+]', '', v)
        
        # Deve começar com + e ter entre 10 e 15 dígitos
        if not re.match(r'^\+\d{10,15}$', cleaned):
            raise ValueError(
                "WhatsApp deve estar em formato internacional (+5511999999999)"
            )
        
        return cleaned
    
    class Config:
        json_schema_extra = {
            "example": {
                "activity": "criador",
                "app_name": "inFluency",
                "price": "$49",
                "price_with_commission": "$49",
                "name": "João Silva",
                "email": "joao@example.com",
                "whatsapp": "+5511999999999"
            }
        }


class LeadResponse(BaseModel):
    """
    Schema para resposta de lead criado
    """
    id: UUID = Field(..., description="ID único do lead")
    activity: str
    app_name: str
    price: str
    price_with_commission: str
    name: str
    email: EmailStr
    whatsapp: str
    created_at: datetime = Field(..., description="Data de criação")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "activity": "criador",
                "app_name": "inFluency",
                "price": "$49",
                "price_with_commission": "$49",
                "name": "João Silva",
                "email": "joao@example.com",
                "whatsapp": "+5511999999999",
                "created_at": "2026-02-19T23:00:00Z"
            }
        }
