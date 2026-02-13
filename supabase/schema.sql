-- ================================================
-- RENUM SOCIAL AI - DATABASE SCHEMA v2.0
-- Multi-tenant architecture
-- ================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABELA: organizations (Multi-tenant root)
-- ================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan TEXT CHECK (plan IN ('free', 'starter', 'pro')) DEFAULT 'free',
    
    -- Integrações (tokens configurados pelo usuário)
    metricool_user_token TEXT,
    metricool_user_id TEXT,
    metricool_blog_id INTEGER,
    heygen_api_key TEXT,
    opusclip_api_key TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: users (vinculada a organizations)
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'owner',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- ================================================
-- TABELA: videos
-- ================================================
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    
    -- Conteúdo
    title TEXT NOT NULL,
    script TEXT,
    
    -- URLs dos vídeos
    video_raw_url TEXT,
    video_processed_url TEXT,
    thumbnail_url TEXT,
    
    -- Status do processamento
    status TEXT CHECK (status IN ('draft', 'processing', 'ready', 'posted', 'failed')) DEFAULT 'draft',
    
    -- Tipo de módulo que criou
    module_type TEXT CHECK (module_type IN ('research', 'upload', 'avatar')),
    
    -- Metadata do processamento
    duration_seconds INTEGER,
    size_mb DECIMAL(10,2),
    captions JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: posts (agendamentos)
-- ================================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
    
    -- Plataforma e conteúdo
    platform TEXT CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'youtube')) NOT NULL,
    description TEXT NOT NULL,
    
    -- Agendamento
    scheduled_at TIMESTAMPTZ NOT NULL,
    
    -- Integração Metricool
    metricool_post_id TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('scheduled', 'publishing', 'published', 'failed')) DEFAULT 'scheduled',
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TABELA: api_logs (debug/monitoring)
-- ================================================
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Request info
    service TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    
    -- Request/Response
    request_body JSONB,
    response_body JSONB,
    status_code INTEGER,
    
    -- Timing
    duration_ms INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ÍNDICES (Performance)
-- ================================================
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_videos_organization ON videos(organization_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_posts_organization ON posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_api_logs_organization ON api_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_service ON api_logs(service);

-- ================================================
-- TRIGGER: Auto-criar organization + user no signup
-- ================================================

-- Função para criar organization e user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Criar organization automaticamente
    INSERT INTO organizations (name, plan)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'free'
    )
    RETURNING id INTO new_org_id;
    
    -- Criar user vinculado à organization
    INSERT INTO users (id, organization_id, email, full_name, role)
    VALUES (
        NEW.id,
        new_org_id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        'owner'
    );
    
    RETURN NEW;
END;
$$;

-- Trigger que executa após signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ================================================
-- RLS POLICIES (Multi-tenant Security)
-- ================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- ================================================
-- POLICY: organizations
-- ================================================
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own organization"
    ON organizations FOR UPDATE
    USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- ================================================
-- POLICY: users
-- ================================================
CREATE POLICY "Users can view users in their organization"
    ON users FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- ================================================
-- POLICY: videos
-- ================================================
CREATE POLICY "Users can view videos in their organization"
    ON videos FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert videos in their organization"
    ON videos FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update videos in their organization"
    ON videos FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete videos in their organization"
    ON videos FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- ================================================
-- POLICY: posts
-- ====================================
CREATE POLICY "Users can view posts in their organization"
    ON posts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert posts in their organization"
    ON posts FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update posts in their organization"
    ON posts FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete posts in their organization"
    ON posts FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- ================================================
-- POLICY: api_logs
-- ================================================
CREATE POLICY "Users can view api_logs in their organization"
    ON api_logs FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can insert api_logs"
    ON api_logs FOR INSERT
    WITH CHECK (true);

-- ================================================
-- STORAGE BUCKETS
-- ================================================

-- Bucket para vídeos raw (antes de processar)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos-raw', 'videos-raw', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para vídeos processados (com legendas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos-processed', 'videos-processed', false)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- STORAGE POLICIES
-- ================================================

-- Policy: Upload em videos-raw
CREATE POLICY "Users can upload to videos-raw in their organization"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'videos-raw'
        AND (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Download de videos-raw
CREATE POLICY "Users can download from videos-raw in their organization"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'videos-raw'
        AND (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Download de videos-processed
CREATE POLICY "Users can download from videos-processed in their organization"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'videos-processed'
        AND (storage.foldername(name))[1] IN (
            SELECT organization_id::text FROM users WHERE id = auth.uid()
        )
    );

-- ================================================
-- VALIDAÇÃO (queries sugeridas)
-- ================================================
-- Verificar tabelas criadas
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Verificar triggers
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users';

-- Verificar policies RLS
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Verificar buckets
-- SELECT * FROM storage.buckets;