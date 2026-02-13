# Executar schema SQL no Supabase

Este arquivo contém instruções seguras para aplicar o schema SQL (criação de tabelas, triggers, RLS e buckets). ATENÇÃO: executar DDL exige permissões administrativas (service_role) — a chave publishable/anon não é suficiente para criar esquema.

Opções para aplicar o schema:

1) Executar manualmente (recomendado)
- Entre no Supabase Console do seu projeto: https://app.supabase.com
- Acesse "SQL Editor" → "New query"
- Abra o arquivo `supabase/schema.sql` (neste repositório) e cole todo o conteúdo no editor
- Clique em "Run" para executar
- Verifique no final se não houve erros

2) Executar automaticamente via script (apenas se você fornecer service_role key)
- Se você quer que eu execute automaticamente, eu precisaria da service_role key OU que você a defina como variável de ambiente em um ambiente seguro que eu possa usar.
- Observação: compartilhar a service_role key em canais públicos é arriscado. Prefira executar manualmente no Console.

Queries de validação (executar no SQL Editor após o script):

-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Verificar triggers na tabela auth.users
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users';

-- Verificar policies RLS
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Verificar buckets de storage
SELECT * FROM storage.buckets;

Resultados esperados:
- Tabelas: api_logs, organizations, posts, users, videos
- Trigger: on_auth_user_created (outra trigger com esse nome)
- Policies: várias policies criadas para organizations, users, videos, posts, api_logs
- Buckets: videos-raw, videos-processed

Problemas comuns:
- Permissão negada ao executar DDL: significa que você está usando a chave anon/publishable — use o Supabase Console (SQL editor) ou o service_role key.
- Erro ao criar trigger: verifique se a extensão uuid-ossp está habilitada e se a tabela auth.users existe (ela é criada pelo Supabase Auth automaticamente).
- Erro ao inserir em storage.buckets: confirma se o recurso storage está habilitado no projeto.

Se quiser, após você executar o script eu posso:
- Confirmar as queries de validação (você pode colar os resultados aqui)
- Proceder com qualquer ajuste necessário nas policies ou no schema

Se preferir que eu rode o script por você, diga explicitamente como quer fornecer a service_role key (ou me dê permissão via integração segura) e eu executarei.