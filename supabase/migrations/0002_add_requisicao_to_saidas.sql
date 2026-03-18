alter table public.saidas_combustivel
add column if not exists requisicao text;

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
  v_requisicao text;
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
  v_requisicao := nullif(trim(coalesce(p_payload ->> 'requisicao', '')), '');
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
  if v_movement_type = 'regular' and (v_usuario_nome is null or v_area_nome is null or v_equipamento_nome is null or v_requisicao is null) then
    raise exception 'Saida operacional exige usuario, area, equipamento e requisicao';
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
    requisicao,
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
    v_requisicao,
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
