create table if not exists public.produtos_gerais (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  categoria text not null check (categoria in ('Pecas', 'Movelaria', 'Material eletrico', 'Ferramentas', 'EPI', 'Outros')),
  unidade text not null,
  area_responsavel text not null,
  estoque_minimo numeric(14,3) not null default 0,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.entradas_produtos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  produto_id uuid not null references public.produtos_gerais (id),
  quantidade numeric(14,3) not null check (quantidade > 0),
  custo_unitario numeric(14,6) not null default 0,
  fornecedor text not null,
  nota_fiscal text,
  observacao text,
  created_by_id uuid not null references public.users (id),
  created_by_nome text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.saidas_produtos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  produto_id uuid not null references public.produtos_gerais (id),
  quantidade numeric(14,3) not null check (quantidade > 0),
  area text not null,
  solicitante text not null,
  aplicacao text,
  observacao text,
  created_by_id uuid not null references public.users (id),
  created_by_nome text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.estoque_produtos (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null unique references public.produtos_gerais (id),
  produto_nome text not null,
  categoria text not null,
  unidade text not null,
  area_responsavel text not null,
  quantidade_entrada numeric(14,3) not null default 0,
  quantidade_saida numeric(14,3) not null default 0,
  saldo_atual numeric(14,3) not null default 0,
  custo_medio numeric(14,6) not null default 0,
  valor_estoque numeric(14,2) not null default 0,
  estoque_minimo numeric(14,3) not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_produtos_gerais_updated_at on public.produtos_gerais;
create trigger set_produtos_gerais_updated_at before update on public.produtos_gerais for each row execute function public.set_updated_at();

drop trigger if exists set_entradas_produtos_updated_at on public.entradas_produtos;
create trigger set_entradas_produtos_updated_at before update on public.entradas_produtos for each row execute function public.set_updated_at();

drop trigger if exists set_saidas_produtos_updated_at on public.saidas_produtos;
create trigger set_saidas_produtos_updated_at before update on public.saidas_produtos for each row execute function public.set_updated_at();

drop trigger if exists set_estoque_produtos_updated_at on public.estoque_produtos;
create trigger set_estoque_produtos_updated_at before update on public.estoque_produtos for each row execute function public.touch_stock_updated_at();

create index if not exists idx_produtos_gerais_nome on public.produtos_gerais (nome);
create index if not exists idx_entradas_produtos_data on public.entradas_produtos (data desc);
create index if not exists idx_entradas_produtos_produto on public.entradas_produtos (produto_id);
create index if not exists idx_saidas_produtos_data on public.saidas_produtos (data desc);
create index if not exists idx_saidas_produtos_produto on public.saidas_produtos (produto_id);
create index if not exists idx_saidas_produtos_area on public.saidas_produtos (area);

create or replace function public.recalculate_product_stock(p_produto_id uuid)
returns void
language plpgsql
as $$
declare
  v_nome text;
  v_categoria text;
  v_unidade text;
  v_area_responsavel text;
  v_estoque_minimo numeric(14,3) := 0;
  v_quantidade_entrada numeric(14,3) := 0;
  v_quantidade_saida numeric(14,3) := 0;
  v_total_entrada_valor numeric(14,2) := 0;
  v_saldo_atual numeric(14,3) := 0;
  v_custo_medio numeric(14,6) := 0;
  v_valor_estoque numeric(14,2) := 0;
begin
  select nome, categoria, unidade, area_responsavel, estoque_minimo
    into v_nome, v_categoria, v_unidade, v_area_responsavel, v_estoque_minimo
  from public.produtos_gerais
  where id = p_produto_id;

  select coalesce(sum(quantidade), 0), coalesce(sum(quantidade * custo_unitario), 0)
    into v_quantidade_entrada, v_total_entrada_valor
  from public.entradas_produtos
  where produto_id = p_produto_id;

  select coalesce(sum(quantidade), 0)
    into v_quantidade_saida
  from public.saidas_produtos
  where produto_id = p_produto_id;

  v_saldo_atual := greatest(v_quantidade_entrada - v_quantidade_saida, 0);

  if v_quantidade_entrada > 0 then
    v_custo_medio := round((v_total_entrada_valor / v_quantidade_entrada)::numeric, 6);
  end if;

  v_valor_estoque := round((v_saldo_atual * v_custo_medio)::numeric, 2);

  insert into public.estoque_produtos (
    produto_id,
    produto_nome,
    categoria,
    unidade,
    area_responsavel,
    quantidade_entrada,
    quantidade_saida,
    saldo_atual,
    custo_medio,
    valor_estoque,
    estoque_minimo
  ) values (
    p_produto_id,
    v_nome,
    v_categoria,
    v_unidade,
    v_area_responsavel,
    v_quantidade_entrada,
    v_quantidade_saida,
    v_saldo_atual,
    v_custo_medio,
    v_valor_estoque,
    v_estoque_minimo
  )
  on conflict (produto_id) do update
    set produto_nome = excluded.produto_nome,
        categoria = excluded.categoria,
        unidade = excluded.unidade,
        area_responsavel = excluded.area_responsavel,
        quantidade_entrada = excluded.quantidade_entrada,
        quantidade_saida = excluded.quantidade_saida,
        saldo_atual = excluded.saldo_atual,
        custo_medio = excluded.custo_medio,
        valor_estoque = excluded.valor_estoque,
        estoque_minimo = excluded.estoque_minimo,
        updated_at = timezone('utc', now());
end;
$$;

alter table public.produtos_gerais enable row level security;
alter table public.entradas_produtos enable row level security;
alter table public.saidas_produtos enable row level security;
alter table public.estoque_produtos enable row level security;

drop policy if exists produtos_gerais_read_authenticated on public.produtos_gerais;
create policy produtos_gerais_read_authenticated on public.produtos_gerais for select to authenticated using (true);

drop policy if exists entradas_produtos_read_authenticated on public.entradas_produtos;
create policy entradas_produtos_read_authenticated on public.entradas_produtos for select to authenticated using (true);

drop policy if exists saidas_produtos_read_authenticated on public.saidas_produtos;
create policy saidas_produtos_read_authenticated on public.saidas_produtos for select to authenticated using (true);

drop policy if exists estoque_produtos_read_authenticated on public.estoque_produtos;
create policy estoque_produtos_read_authenticated on public.estoque_produtos for select to authenticated using (true);
