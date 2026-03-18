# Teste Local Supabase + API

## 1. Preencher os arquivos de ambiente

Frontend:
- arquivo `.env`
- campos obrigatorios:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_BASE_URL=http://localhost:3333`

Backend:
- arquivo `server/.env`
- campos obrigatorios:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `APP_URL=http://localhost:5173`

## 2. Aplicar o schema no Supabase

Arquivo:
- `supabase/migrations/0001_initial_schema.sql`

Aplicar pelo painel SQL do Supabase ou pela CLI.

## 3. Criar os combustiveis base

Inserir em `combustiveis`:
- Diesel S10
- Diesel S500
- Gasolina
- Etanol

Sugestao de codigos:
- DS10
- DS500
- GAS
- ETA

## 4. Criar area e equipamento de teste

Areas:
- Area Norte
- Area Sul
- Manutencao
- Operacao de Campo

Equipamentos:
- Trator 01
- Escavadeira X
- Caminhao 12

## 5. Criar usuario no Supabase Auth

Criar um usuario com email e senha.

No metadata do usuario, incluir por exemplo:

```json
{
  "nome": "Administrador",
  "role": "admin"
}
```

O trigger do schema cria/atualiza automaticamente `public.users`.

## 6. Subir a API local

```bash
npm run server:dev
```

Health check esperado:
- `http://localhost:3333/api/health`

## 7. Subir o frontend

```bash
npm run dev
```

Abrir:
- `http://localhost:5173/login`

## 8. Fluxo de teste recomendado

1. Fazer login com o usuario do Supabase
2. Ir em `Entradas`
3. Registrar uma entrada normal de `Diesel S10`
4. Validar que o saldo aparece atualizado
5. Ir em `Saidas`
6. Registrar uma saida operacional
7. Validar reducao do saldo
8. Ir em `Emprestimos`
9. Registrar um `Emprestimo enviado`
10. Validar conta corrente e saldo por combustivel
11. Cancelar um registro com justificativa
12. Validar recálculo do saldo

## 9. Comportamento esperado

- com Supabase + API preenchidos e login feito, o sistema entra em modo remoto
- as telas mostram aviso `Modo remoto ativo`
- entradas, saidas, emprestimos e cancelamentos passam a usar a API
- se nao houver configuracao remota, o sistema continua em modo local