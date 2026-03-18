# Supabase Migration Base

Arquivos desta pasta:
- `migrations/0001_initial_schema.sql`: schema inicial em Postgres para substituir o Firestore.

Resumo:
- tabelas centrais do ERP de combustivel
- RLS basica para leituras autenticadas
- funcoes SQL `app_create_entrada` e `app_create_saida`
- recalculo transacional do estoque consolidado
- auditoria em `audit_logs`

Aplicacao da migration:
- com Supabase CLI: `supabase db push`
- ou executando o SQL diretamente no painel do projeto