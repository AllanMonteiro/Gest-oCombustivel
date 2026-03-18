# Plano de Migracao para Supabase + Render

## Objetivo

Substituir o backend Firebase por:
- Supabase Auth
- Supabase Postgres
- API Express no Render
- Cron Job no Render para resumo de email

## Ordem sugerida

1. Aplicar schema SQL no Supabase
2. Popular cadastros base
3. Subir API Express no Render
4. Integrar login no frontend com Supabase Auth
5. Integrar `Entradas`, `Saidas` e `Emprestimos` com a API
6. Integrar `Dashboard` e `Relatorios`
7. Migrar rotina de email para cron do Render
8. Remover dependencia operacional do Firebase

## Variaveis para o Render Web Service

- `PORT`
- `APP_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `EMAIL_SUMMARY_ENABLED`
- `EMAIL_SUMMARY_FREQUENCY`
- `EMAIL_SUMMARY_RECIPIENTS`

## Servicos do Render

### 1. Static Site

Publica o frontend `dist/`.

Build command:

```bash
npm install && npm run build
```

Publish directory:

```bash
dist
```

### 2. Web Service

Publica o backend `server/`.

Build command:

```bash
npm install && npm run server:build
```

Start command:

```bash
npm --prefix server run start
```

### 3. Cron Job

Pode chamar um endpoint interno da API para gerar e enviar resumo por email.