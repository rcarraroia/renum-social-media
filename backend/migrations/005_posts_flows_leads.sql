-- Migration: Posts Flows - Tabela de Leads (Atualizada)
-- Descrição: Cria tabela para armazenar leads da landing page com 5 passos
-- Data: 2026-02-16

-- Criar tabela de leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity TEXT NOT NULL CHECK (activity IN ('consultora', 'politico', 'profissional_liberal', 'educador', 'fitness', 'criador', 'empreendedor', 'estudante', 'geral')),
    app_name TEXT NOT NULL CHECK (app_name IN ('SocialFlow', 'SmartGenius', 'inFluency')),
    price TEXT NOT NULL CHECK (price IN ('$29', '$49', '$99')),
    price_with_commission TEXT NOT NULL CHECK (price_with_commission IN ('$29', '$49', '$99')),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    whatsapp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_activity ON leads(activity);
CREATE INDEX IF NOT EXISTS idx_leads_app_name ON leads(app_name);
CREATE INDEX IF NOT EXISTS idx_leads_price ON leads(price);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();

-- Comentários nas colunas
COMMENT ON TABLE leads IS 'Leads da landing page com formulário de 5 passos';
COMMENT ON COLUMN leads.id IS 'ID único do lead';
COMMENT ON COLUMN leads.activity IS 'Atividade profissional: consultora, politico, profissional_liberal, educador, fitness, criador, empreendedor, estudante, geral';
COMMENT ON COLUMN leads.app_name IS 'Nome do app escolhido: SocialFlow, SmartGenius, inFluency';
COMMENT ON COLUMN leads.price IS 'Faixa de preço escolhida: $29, $49, $99';
COMMENT ON COLUMN leads.price_with_commission IS 'Faixa de preço com comissão: $29, $49, $99';
COMMENT ON COLUMN leads.name IS 'Nome completo do lead';
COMMENT ON COLUMN leads.email IS 'Email do lead (único)';
COMMENT ON COLUMN leads.whatsapp IS 'WhatsApp em formato internacional';
COMMENT ON COLUMN leads.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN leads.updated_at IS 'Data da última atualização';
