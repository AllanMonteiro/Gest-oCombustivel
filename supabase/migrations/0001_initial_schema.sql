create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'operador', 'gestor')),
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.combustiveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  codigo text not null unique,
  unidade text not null default 'L',
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  tipo text not null,
  area_padrao_id uuid references public.areas (id),
  area_padrao_nome text,
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.entradas_combustivel (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  fornecedor text not null,
  combustivel_id uuid not null references public.combustiveis (id),
  combustivel_nome text not null,
  litros numeric(14,3) not null check (litros > 0),
  valor_litro numeric(14,6) not null default 0,
  valor_total numeric(14,2) not null default 0,
  nota_fiscal text,
  observacao text,
  movement_type text not null default 'regular' check (movement_type in ('regular', 'loan_in', 'return_in')),
  partner_name text,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancellation_reason text,
  created_by_id uuid not null references public.users (id),
  created_by_nome text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.saidas_combustivel (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  combustivel_id uuid not null references public.combustiveis (id),
  combustivel_nome text not null,
  litros numeric(14,3) not null check (litros > 0),
  usuario_id uuid references public.users (id),
  usuario_nome text,
  area_id uuid references public.areas (id),
  area_nome text,
  equipamento_id uuid references public.equipamentos (id),
  equipamento_nome text,
  observacao text,
  movement_type text not null default 'regular' check (movement_type in ('regular', 'loan_out', 'return_out')),
  partner_name text,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  cancellation_reason text,
  created_by_id uuid not null references public.users (id),
  created_by_nome text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.estoque_combustivel (
  id uuid primary key default gen_random_uuid(),
  combustivel_id uuid not null unique references public.combustiveis (id),
  combustivel_nome text not null,
  total_litros numeric(14,3) not null default 0,
  custo_medio numeric(14,6) not null default 0,
  valor_total_estoque numeric(14,2) not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  acao text not null,
  entidade text not null,
  entidade_id uuid not null,
  dados_anteriores jsonb,
  dados_novos jsonb,
  usuario_id uuid,
  usuario_nome text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.email_summary_settings (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default true,
  recipients text[] not null default '{}',
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'monthly')),
  schedule_label text not null default '07:00',
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.touch_stock_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();

drop trigger if exists set_combustiveis_updated_at on public.combustiveis;
create trigger set_combustiveis_updated_at before update on public.combustiveis for each row execute function public.set_updated_at();

drop trigger if exists set_areas_updated_at on public.areas;
create trigger set_areas_updated_at before update on public.areas for each row execute function public.set_updated_at();

drop trigger if exists set_equipamentos_updated_at on public.equipamentos;
create trigger set_equipamentos_updated_at before update on public.equipamentos for each row execute function public.set_updated_at();

drop trigger if exists set_entradas_updated_at on public.entradas_combustivel;
create trigger set_entradas_updated_at before update on public.entradas_combustivel for each row execute function public.set_updated_at();

drop trigger if exists set_saidas_updated_at on public.saidas_combustivel;
create trigger set_saidas_updated_at before update on public.saidas_combustivel for each row execute function public.set_updated_at();

drop trigger if exists set_stock_updated_at on public.estoque_combustivel;
create trigger set_stock_updated_at before update on public.estoque_combustivel for each row execute function public.touch_stock_updated_at();

create index if not exists idx_entradas_data on public.entradas_combustivel (data desc);
create index if not exists idx_entradas_combustivel on public.entradas_combustivel (combustivel_id, status);
create index if not exists idx_entradas_partner on public.entradas_combustivel (partner_name) where partner_name is not null;
create index if not exists idx_saidas_data on public.saidas_combustivel (data desc);
create index if not exists idx_saidas_combustivel on public.saidas_combustivel (combustivel_id, status);
create index if not exists idx_saidas_area on public.saidas_combustivel (area_id) where area_id is not null;
create index if not exists idx_saidas_equipamento on public.saidas_combustivel (equipamento_id) where equipamento_id is not null;
create index if not exists idx_saidas_partner on public.saidas_combustivel (partner_name) where partner_name is not null;
create index if not exists idx_audit_logs_entidade on public.audit_logs (entidade, entidade_id, created_at desc);

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, nome, email, role, ativo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'operador'),
    true
  )
  on conflict (id) do update
    set nome = excluded.nome,
        email = excluded.email,
        role = excluded.role,
        ativo = true,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

create or replace function public.recalculate_stock(p_combustivel_id uuid)
returns void
language plpgsql
as $$
declare
  v_nome text;
  v_litros_entrada numeric(14,3) := 0;
  v_litros_saida numeric(14,3) := 0;
  v_regular_entry_liters numeric(14,3) := 0;
  v_regular_entry_value numeric(14,2) := 0;
  v_custo_medio numeric(14,6) := 0;
  v_total_litros numeric(14,3) := 0;
  v_valor_total numeric(14,2) := 0;
begin
  select nome into v_nome from public.combustiveis where id = p_combustivel_id;

  select coalesce(sum(litros), 0)
    into v_litros_entrada
  from public.entradas_combustivel
  where combustivel_id = p_combustivel_id
    and status = 'active';

  select coalesce(sum(litros), 0)
    into v_litros_saida
  from public.saidas_combustivel
  where combustivel_id = p_combustivel_id
    and status = 'active';

  select coalesce(sum(litros), 0), coalesce(sum(valor_total), 0)
    into v_regular_entry_liters, v_regular_entry_value
  from public.entradas_combustivel
  where combustivel_id = p_combustivel_id
    and status = 'active'
    and movement_type = 'regular';

  v_total_litros := greatest(v_litros_entrada - v_litros_saida, 0);

  if v_regular_entry_liters > 0 then
    v_custo_medio := round((v_regular_entry_value / v_regular_entry_liters)::numeric, 6);
  end if;

  v_valor_total := round((v_total_litros * v_custo_medio)::numeric, 2);

  insert into public.estoque_combustivel (combustivel_id, combustivel_nome, total_litros, custo_medio, valor_total_estoque)
  values (p_combustivel_id, v_nome, v_total_litros, v_custo_medio, v_valor_total)
  on conflict (combustivel_id) do update
    set combustivel_nome = excluded.combustivel_nome,
        total_litros = excluded.total_litros,
        custo_medio = excluded.custo_medio,
        valor_total_estoque = excluded.valor_total_estoque,
        updated_at = timezone('utc', now());
end;
$$;

create or replace function public.insert_audit_log(
  p_acao text,
  p_entidade text,
  p_entidade_id uuid,
  p_dados_anteriores jsonb,
  p_dados_novos jsonb,
  p_usuario_id uuid,
  p_usuario_nome text
)
returns void
language sql
as $$
  insert into public.audit_logs (
    acao,
    entidade,
    entidade_id,
    dados_anteriores,
    dados_novos,
    usuario_id,
    usuario_nome
  ) values (
    p_acao,
    p_entidade,
    p_entidade_id,
    p_dados_anteriores,
    p_dados_novos,
    p_usuario_id,
    p_usuario_nome
  );
$$;

create or replace function public.app_create_entrada(
  p_payload jsonb,
  p_actor_id uuid,
  p_actor_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_combustivel_id uuid;
  v_combustivel_nome text;
  v_data date;
  v_fornecedor text;
  v_litros numeric(14,3);
  v_valor_litro numeric(14,6);
  v_valor_total numeric(14,2);
  v_nota_fiscal text;
  v_observacao text;
  v_movement_type text;
  v_partner_name text;
  v_inserted public.entradas_combustivel;
begin
  v_combustivel_id := nullif(p_payload ->> 'combustivel_id', '')::uuid;
  v_data := (p_payload ->> 'data')::date;
  v_fornecedor := trim(coalesce(p_payload ->> 'fornecedor', ''));
  v_litros := coalesce((p_payload ->> 'litros')::numeric, 0);
  v_valor_litro := coalesce((p_payload ->> 'valor_litro')::numeric, 0);
  v_nota_fiscal := nullif(trim(coalesce(p_payload ->> 'nota_fiscal', '')), '');
  v_observacao := nullif(trim(coalesce(p_payload ->> 'observacao', '')), '');
  v_movement_type := coalesce(nullif(p_payload ->> 'movement_type', ''), 'regular');
  v_partner_name := nullif(trim(coalesce(p_payload ->> 'partner_name', '')), '');

  if v_combustivel_id is null then
    raise exception 'Combustivel obrigatorio';
  end if;
  if v_data is null then
    raise exception 'Data obrigatoria';
  end if;
  if v_fornecedor = '' then
    raise exception 'Fornecedor obrigatorio';
  end if;
  if v_litros <= 0 then
    raise exception 'Litros devem ser maiores que zero';
  end if;
  if v_movement_type not in ('regular', 'loan_in', 'return_in') then
    raise exception 'Tipo de entrada invalido';
  end if;

  select nome into v_combustivel_nome from public.combustiveis where id = v_combustivel_id and ativo = true;
  if v_combustivel_nome is null then
    raise exception 'Combustivel nao encontrado';
  end if;

  v_valor_total := round((v_litros * v_valor_litro)::numeric, 2);

  insert into public.entradas_combustivel (
    data,
    fornecedor,
    combustivel_id,
    combustivel_nome,
    litros,
    valor_litro,
    valor_total,
    nota_fiscal,
    observacao,
    movement_type,
    partner_name,
    created_by_id,
    created_by_nome
  ) values (
    v_data,
    v_fornecedor,
    v_combustivel_id,
    v_combustivel_nome,
    v_litros,
    v_valor_litro,
    v_valor_total,
    v_nota_fiscal,
    v_observacao,
    v_movement_type,
    v_partner_name,
    p_actor_id,
    p_actor_name
  ) returning * into v_inserted;

  perform public.recalculate_stock(v_combustivel_id);
  perform public.insert_audit_log('create', 'entrada_combustivel', v_inserted.id, null, to_jsonb(v_inserted), p_actor_id, p_actor_name);

  return to_jsonb(v_inserted);
end;
$$;

create or replace function public.app_create_saida(
  p_payload jsonb,
  p_actor_id uuid,
  p_actor_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_combustivel_id uuid;
  v_combustivel_nome text;
  v_data date;
  v_litros numeric(14,3);
  v_usuario_id uuid;
  v_usuario_nome text;
  v_area_id uuid;
  v_area_nome text;
  v_equipamento_id uuid;
  v_equipamento_nome text;
  v_observacao text;
  v_movement_type text;
  v_partner_name text;
  v_saldo_atual numeric(14,3) := 0;
  v_inserted public.saidas_combustivel;
begin
  v_combustivel_id := nullif(p_payload ->> 'combustivel_id', '')::uuid;
  v_data := (p_payload ->> 'data')::date;
  v_litros := coalesce((p_payload ->> 'litros')::numeric, 0);
  v_usuario_id := nullif(p_payload ->> 'usuario_id', '')::uuid;
  v_usuario_nome := nullif(trim(coalesce(p_payload ->> 'usuario_nome', '')), '');
  v_area_id := nullif(p_payload ->> 'area_id', '')::uuid;
  v_area_nome := nullif(trim(coalesce(p_payload ->> 'area_nome', '')), '');
  v_equipamento_id := nullif(p_payload ->> 'equipamento_id', '')::uuid;
  v_equipamento_nome := nullif(trim(coalesce(p_payload ->> 'equipamento_nome', '')), '');
  v_observacao := nullif(trim(coalesce(p_payload ->> 'observacao', '')), '');
  v_movement_type := coalesce(nullif(p_payload ->> 'movement_type', ''), 'regular');
  v_partner_name := nullif(trim(coalesce(p_payload ->> 'partner_name', '')), '');

  if v_combustivel_id is null then
    raise exception 'Combustivel obrigatorio';
  end if;
  if v_data is null then
    raise exception 'Data obrigatoria';
  end if;
  if v_litros <= 0 then
    raise exception 'Litros devem ser maiores que zero';
  end if;
  if v_movement_type not in ('regular', 'loan_out', 'return_out') then
    raise exception 'Tipo de saida invalido';
  end if;
  if v_movement_type = 'regular' and (v_usuario_nome is null or v_area_nome is null or v_equipamento_nome is null) then
    raise exception 'Saida operacional exige usuario, area e equipamento';
  end if;

  select nome into v_combustivel_nome from public.combustiveis where id = v_combustivel_id and ativo = true;
  if v_combustivel_nome is null then
    raise exception 'Combustivel nao encontrado';
  end if;

  select total_litros into v_saldo_atual from public.estoque_combustivel where combustivel_id = v_combustivel_id;
  v_saldo_atual := coalesce(v_saldo_atual, 0);

  if v_litros > v_saldo_atual then
    raise exception 'Saldo insuficiente para este combustivel';
  end if;

  insert into public.saidas_combustivel (
    data,
    combustivel_id,
    combustivel_nome,
    litros,
    usuario_id,
    usuario_nome,
    area_id,
    area_nome,
    equipamento_id,
    equipamento_nome,
    observacao,
    movement_type,
    partner_name,
    created_by_id,
    created_by_nome
  ) values (
    v_data,
    v_combustivel_id,
    v_combustivel_nome,
    v_litros,
    v_usuario_id,
    v_usuario_nome,
    v_area_id,
    v_area_nome,
    v_equipamento_id,
    v_equipamento_nome,
    v_observacao,
    v_movement_type,
    v_partner_name,
    p_actor_id,
    p_actor_name
  ) returning * into v_inserted;

  perform public.recalculate_stock(v_combustivel_id);
  perform public.insert_audit_log('create', 'saida_combustivel', v_inserted.id, null, to_jsonb(v_inserted), p_actor_id, p_actor_name);

  return to_jsonb(v_inserted);
end;
$$;

alter table public.users enable row level security;
alter table public.combustiveis enable row level security;
alter table public.areas enable row level security;
alter table public.equipamentos enable row level security;
alter table public.entradas_combustivel enable row level security;
alter table public.saidas_combustivel enable row level security;
alter table public.estoque_combustivel enable row level security;
alter table public.audit_logs enable row level security;
alter table public.email_summary_settings enable row level security;

drop policy if exists users_select_self_or_admin on public.users;
create policy users_select_self_or_admin on public.users for select to authenticated using (id = auth.uid() or public.current_app_role() = 'admin');

drop policy if exists users_update_self_or_admin on public.users;
create policy users_update_self_or_admin on public.users for update to authenticated using (id = auth.uid() or public.current_app_role() = 'admin') with check (id = auth.uid() or public.current_app_role() = 'admin');

drop policy if exists combustiveis_read_authenticated on public.combustiveis;
create policy combustiveis_read_authenticated on public.combustiveis for select to authenticated using (true);

drop policy if exists areas_read_authenticated on public.areas;
create policy areas_read_authenticated on public.areas for select to authenticated using (true);

drop policy if exists equipamentos_read_authenticated on public.equipamentos;
create policy equipamentos_read_authenticated on public.equipamentos for select to authenticated using (true);

drop policy if exists entradas_read_authenticated on public.entradas_combustivel;
create policy entradas_read_authenticated on public.entradas_combustivel for select to authenticated using (true);

drop policy if exists saidas_read_authenticated on public.saidas_combustivel;
create policy saidas_read_authenticated on public.saidas_combustivel for select to authenticated using (true);

drop policy if exists estoque_read_authenticated on public.estoque_combustivel;
create policy estoque_read_authenticated on public.estoque_combustivel for select to authenticated using (true);

drop policy if exists audit_logs_read_admin_or_gestor on public.audit_logs;
create policy audit_logs_read_admin_or_gestor on public.audit_logs for select to authenticated using (public.current_app_role() in ('admin', 'gestor'));

drop policy if exists email_settings_read_admin on public.email_summary_settings;
create policy email_settings_read_admin on public.email_summary_settings for select to authenticated using (public.current_app_role() = 'admin');

drop policy if exists email_settings_update_admin on public.email_summary_settings;
create policy email_settings_update_admin on public.email_summary_settings for update to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');