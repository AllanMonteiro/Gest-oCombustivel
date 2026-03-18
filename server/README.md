# Render API Base

Backend Express preparado para substituir as Cloud Functions no fluxo Supabase + Render.

Endpoints iniciais:
- `POST /api/entradas`
- `POST /api/saidas`
- `GET /api/dashboard`
- `GET /api/relatorios/movimentacoes`
- `GET /api/relatorios/movimentacoes.csv`
- `GET /api/health`

Observacao atual:
- nesta fase de migracao o backend usa cabecalhos `x-user-id`, `x-user-name` e `x-user-role`
- o passo seguinte e trocar isso por validacao real do JWT do Supabase Auth