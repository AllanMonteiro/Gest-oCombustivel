# Controle de Combustivel

Sistema web administrativo para controle de combustivel com frontend em React + TypeScript + Vite e duas trilhas de backend preparadas:
- Firebase Functions + Hosting
- Supabase + Render

## Estrutura

```text
root/
  functions/
  public/
  server/
  src/
  supabase/
  firebase.json
  firestore.indexes.json
  firestore.rules
  package.json
```

## Estado atual

Ja existe base pronta para:
- frontend em React/Vite/Tailwind
- backend Firebase com resumo por email
- nova trilha de migracao para Supabase + Render com schema SQL e API Express

## Migracao para Supabase + Render

Arquivos principais da nova trilha:
- `supabase/migrations/0001_initial_schema.sql`
- `supabase/README.md`
- `server/src/index.ts`
- `server/src/app.ts`
- `server/src/routes/index.ts`
- `server/src/repositories/estoque.repository.ts`
- `server/src/services/dashboard.service.ts`
- `server/src/services/relatorios.service.ts`

### O que ja esta pronto na migracao

Schema SQL inicial com:
- usuarios
- combustiveis
- areas
- equipamentos
- entradas_combustivel
- saidas_combustivel
- estoque_combustivel
- audit_logs
- email_summary_settings
- RLS basica
- trigger para espelhar `auth.users` em `public.users`
- funcoes SQL `app_create_entrada` e `app_create_saida`
- recalculo consolidado de estoque via `recalculate_stock`

API Express inicial com endpoints:
- `POST /api/entradas`
- `POST /api/saidas`
- `GET /api/dashboard`
- `GET /api/relatorios/movimentacoes`
- `GET /api/relatorios/movimentacoes.csv`
- `GET /api/health`

### Passos de implantacao no Supabase + Render

1. Criar o projeto no Supabase
2. Aplicar a migration `supabase/migrations/0001_initial_schema.sql`
3. Configurar variaveis do backend em `server/.env.example`
4. Publicar o frontend no Render Static Site
5. Publicar `server/` no Render Web Service
6. Trocar o frontend gradualmente do contexto local para Supabase + API

### Scripts uteis

Frontend:

```bash
npm run build
```

API Render/Supabase:

```bash
npm run server:dev
npm run server:build
```

## Trilha Firebase

O projeto continua com deploy em Firebase tambem.

Scripts:

```bash
npm run firebase:deploy:hosting
npm run firebase:deploy:functions
npm run firebase:deploy:firestore
npm run firebase:deploy:all
```

## Observacoes importantes

- a API Express nova ainda usa cabecalhos `x-user-id`, `x-user-name` e `x-user-role` para acelerar a migracao
- o proximo passo recomendado e integrar JWT real do Supabase Auth no backend
- o frontend ainda nao foi trocado para consumir a API nova automaticamente
- a base local atual continua funcionando enquanto a migracao e feita por etapas