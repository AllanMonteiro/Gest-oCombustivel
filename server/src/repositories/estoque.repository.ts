import { supabaseAdmin } from "../config/supabase.js";
import type { DashboardFilters } from "../types/domain.js";
import { HttpError } from "../utils/http-error.js";

function applyDateRange<T extends { gte: Function; lte: Function }>(query: T, dataInicial?: string, dataFinal?: string) {
  if (dataInicial) query.gte("data", dataInicial);
  if (dataFinal) query.lte("data", dataFinal);
  return query;
}

async function getCombustivelIdByName(nome: string) {
  const { data, error } = await supabaseAdmin
    .from("combustiveis")
    .select("id, nome")
    .eq("nome", nome)
    .eq("ativo", true)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message, error);
  if (!data) throw new HttpError(400, `Combustivel '${nome}' nao encontrado.`);
  return data.id as string;
}

async function getAreaByName(nome?: string) {
  if (!nome) return { id: null, nome: null };
  const { data, error } = await supabaseAdmin
    .from("areas")
    .select("id, nome")
    .eq("nome", nome)
    .eq("ativo", true)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message, error);
  return { id: data?.id ?? null, nome: data?.nome ?? nome };
}

async function getEquipamentoByName(nome?: string) {
  if (!nome) return { id: null, nome: null };
  const { data, error } = await supabaseAdmin
    .from("equipamentos")
    .select("id, nome")
    .eq("nome", nome)
    .eq("ativo", true)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message, error);
  return { id: data?.id ?? null, nome: data?.nome ?? nome };
}

export async function callCreateEntradaRpc(payload: Record<string, unknown>, actorId: string, actorName: string) {
  const combustivelId = await getCombustivelIdByName(String(payload.combustivel ?? ""));

  const { data, error } = await supabaseAdmin.rpc("app_create_entrada", {
    p_payload: {
      data: payload.data,
      fornecedor: payload.fornecedor,
      combustivel_id: combustivelId,
      litros: payload.litros,
      valor_litro: payload.valorLitro,
      nota_fiscal: payload.notaFiscal,
      observacao: payload.observacao,
      movement_type: payload.movementType,
      partner_name: payload.partnerName,
    },
    p_actor_id: actorId,
    p_actor_name: actorName,
  });

  if (error) throw new HttpError(400, error.message, error);
  return data;
}

export async function callCreateSaidaRpc(payload: Record<string, unknown>, actorId: string, actorName: string) {
  const combustivelId = await getCombustivelIdByName(String(payload.combustivel ?? ""));
  const area = await getAreaByName(typeof payload.areaNome === "string" ? payload.areaNome : undefined);
  const equipamento = await getEquipamentoByName(typeof payload.equipamentoNome === "string" ? payload.equipamentoNome : undefined);

  const { data, error } = await supabaseAdmin.rpc("app_create_saida", {
    p_payload: {
      data: payload.data,
      combustivel_id: combustivelId,
      litros: payload.litros,
      usuario_id: payload.usuarioId,
      usuario_nome: payload.usuarioNome,
      area_id: area.id,
      area_nome: area.nome,
      equipamento_id: equipamento.id,
      equipamento_nome: equipamento.nome,
      requisicao: payload.requisicao,
      observacao: payload.observacao,
      movement_type: payload.movementType,
      partner_name: payload.partnerName,
    },
    p_actor_id: actorId,
    p_actor_name: actorName,
  });

  if (error) throw new HttpError(400, error.message, error);
  return data;
}

export async function updateEntryData(id: string, payload: Record<string, unknown>, actorId: string, actorName: string) {
  const { data: current, error: currentError } = await supabaseAdmin
    .from("entradas_combustivel")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError) throw new HttpError(404, "Entrada nao encontrada.", currentError);

  const combustivelId = await getCombustivelIdByName(String(payload.combustivel ?? ""));
  const litros = Number(payload.litros ?? 0);
  const valorLitro = Number(payload.valorLitro ?? 0);
  const valorTotal = Math.round(litros * valorLitro * 100) / 100;

  const updatePayload = {
    data: payload.data,
    fornecedor: payload.fornecedor,
    combustivel_id: combustivelId,
    combustivel_nome: payload.combustivel,
    litros,
    valor_litro: valorLitro,
    valor_total: valorTotal,
    nota_fiscal: payload.notaFiscal,
    observacao: payload.observacao,
    movement_type: payload.movementType,
    partner_name: payload.partnerName,
  };

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("entradas_combustivel")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) throw new HttpError(500, updateError.message, updateError);

  await supabaseAdmin.rpc("recalculate_stock", { p_combustivel_id: current.combustivel_id });
  if (current.combustivel_id !== combustivelId) {
    await supabaseAdmin.rpc("recalculate_stock", { p_combustivel_id: combustivelId });
  }
  await supabaseAdmin.rpc("insert_audit_log", {
    p_acao: "update",
    p_entidade: "entrada_combustivel",
    p_entidade_id: id,
    p_dados_anteriores: current,
    p_dados_novos: updated,
    p_usuario_id: actorId,
    p_usuario_nome: actorName,
  });

  return updated;
}

export async function updateExitData(id: string, payload: Record<string, unknown>, actorId: string, actorName: string) {
  const { data: current, error: currentError } = await supabaseAdmin
    .from("saidas_combustivel")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError) throw new HttpError(404, "Saida nao encontrada.", currentError);

  const combustivelId = await getCombustivelIdByName(String(payload.combustivel ?? ""));
  const area = await getAreaByName(typeof payload.areaNome === "string" ? payload.areaNome : undefined);
  const equipamento = await getEquipamentoByName(typeof payload.equipamentoNome === "string" ? payload.equipamentoNome : undefined);
  const litros = Number(payload.litros ?? 0);

  const { data: currentStock } = await supabaseAdmin
    .from("estoque_combustivel")
    .select("total_litros")
    .eq("combustivel_id", combustivelId)
    .maybeSingle();

  const saldoAtual = Number(currentStock?.total_litros ?? 0) + (current.combustivel_id === combustivelId ? Number(current.litros ?? 0) : 0);
  if (litros > saldoAtual) {
    throw new HttpError(400, `Saldo insuficiente para ${String(payload.combustivel ?? "combustivel")}. Disponivel: ${saldoAtual.toLocaleString("pt-BR")} L`);
  }

  const updatePayload = {
    data: payload.data,
    combustivel_id: combustivelId,
    combustivel_nome: payload.combustivel,
    litros,
    usuario_nome: payload.usuarioNome,
    area_id: area.id,
    area_nome: area.nome,
    equipamento_id: equipamento.id,
    equipamento_nome: equipamento.nome,
    requisicao: payload.requisicao,
    observacao: payload.observacao,
    movement_type: payload.movementType,
    partner_name: payload.partnerName,
  };

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("saidas_combustivel")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) throw new HttpError(500, updateError.message, updateError);

  await supabaseAdmin.rpc("recalculate_stock", { p_combustivel_id: current.combustivel_id });
  if (current.combustivel_id !== combustivelId) {
    await supabaseAdmin.rpc("recalculate_stock", { p_combustivel_id: combustivelId });
  }
  await supabaseAdmin.rpc("insert_audit_log", {
    p_acao: "update",
    p_entidade: "saida_combustivel",
    p_entidade_id: id,
    p_dados_anteriores: current,
    p_dados_novos: updated,
    p_usuario_id: actorId,
    p_usuario_nome: actorName,
  });

  return updated;
}
export async function getDashboardBaseData(filters: DashboardFilters) {
  const stockQuery = supabaseAdmin
    .from("estoque_combustivel")
    .select("combustivel_id, combustivel_nome, total_litros, custo_medio, valor_total_estoque")
    .order("combustivel_nome", { ascending: true });

  const entriesQuery = supabaseAdmin
    .from("entradas_combustivel")
    .select("id, data, combustivel_id, combustivel_nome, litros, valor_total, valor_litro, fornecedor, nota_fiscal, observacao, movement_type, partner_name, status, cancellation_reason")
    .order("data", { ascending: false });

  const exitsQuery = supabaseAdmin
    .from("saidas_combustivel")
    .select("id, data, combustivel_id, combustivel_nome, litros, area_id, area_nome, equipamento_id, equipamento_nome, usuario_id, usuario_nome, requisicao, observacao, movement_type, partner_name, status, cancellation_reason")
    .order("data", { ascending: false });

  if (filters.combustivelId) {
    stockQuery.eq("combustivel_id", filters.combustivelId);
    entriesQuery.eq("combustivel_id", filters.combustivelId);
    exitsQuery.eq("combustivel_id", filters.combustivelId);
  }
  if (filters.partnerName) {
    entriesQuery.eq("partner_name", filters.partnerName);
    exitsQuery.eq("partner_name", filters.partnerName);
  }
  if (filters.areaId) exitsQuery.eq("area_id", filters.areaId);
  if (filters.equipamentoId) exitsQuery.eq("equipamento_id", filters.equipamentoId);
  if (filters.usuarioId) exitsQuery.eq("usuario_id", filters.usuarioId);

  applyDateRange(entriesQuery, filters.dataInicial, filters.dataFinal);
  applyDateRange(exitsQuery, filters.dataInicial, filters.dataFinal);

  const [{ data: stock, error: stockError }, { data: entries, error: entriesError }, { data: exits, error: exitsError }] = await Promise.all([
    stockQuery,
    entriesQuery,
    exitsQuery,
  ]);

  if (stockError) throw new HttpError(500, stockError.message, stockError);
  if (entriesError) throw new HttpError(500, entriesError.message, entriesError);
  if (exitsError) throw new HttpError(500, exitsError.message, exitsError);

  return {
    stock: stock ?? [],
    entries: entries ?? [],
    exits: exits ?? [],
  };
}

export async function getRelatorioMovimentacoesData(filters: DashboardFilters & { status?: string }) {
  const entriesQuery = supabaseAdmin
    .from("entradas_combustivel")
    .select("id, data, fornecedor, combustivel_id, combustivel_nome, litros, valor_total, movement_type, partner_name, status, created_by_nome, cancellation_reason")
    .order("data", { ascending: false });

  const exitsQuery = supabaseAdmin
    .from("saidas_combustivel")
    .select("id, data, combustivel_id, combustivel_nome, litros, area_id, area_nome, equipamento_id, equipamento_nome, usuario_id, usuario_nome, requisicao, movement_type, partner_name, status, created_by_nome, cancellation_reason")
    .order("data", { ascending: false });

  if (filters.combustivelId) {
    entriesQuery.eq("combustivel_id", filters.combustivelId);
    exitsQuery.eq("combustivel_id", filters.combustivelId);
  }
  if (filters.partnerName) {
    entriesQuery.eq("partner_name", filters.partnerName);
    exitsQuery.eq("partner_name", filters.partnerName);
  }
  if (filters.areaId) exitsQuery.eq("area_id", filters.areaId);
  if (filters.equipamentoId) exitsQuery.eq("equipamento_id", filters.equipamentoId);
  if (filters.usuarioId) exitsQuery.eq("usuario_id", filters.usuarioId);
  if (filters.status) {
    entriesQuery.eq("status", filters.status);
    exitsQuery.eq("status", filters.status);
  }

  applyDateRange(entriesQuery, filters.dataInicial, filters.dataFinal);
  applyDateRange(exitsQuery, filters.dataInicial, filters.dataFinal);

  const [{ data: entries, error: entriesError }, { data: exits, error: exitsError }] = await Promise.all([entriesQuery, exitsQuery]);

  if (entriesError) throw new HttpError(500, entriesError.message, entriesError);
  if (exitsError) throw new HttpError(500, exitsError.message, exitsError);

  return {
    entries: entries ?? [],
    exits: exits ?? [],
  };
}

export async function getOperationalStateData() {
  const { stock, entries, exits } = await getDashboardBaseData({});
  return { stock, entries, exits };
}

export async function cancelEntryData(id: string, reason: string, actorId: string, actorName: string) {
  const { data: current, error: currentError } = await supabaseAdmin
    .from("entradas_combustivel")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError) throw new HttpError(404, "Entrada nao encontrada.", currentError);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("entradas_combustivel")
    .update({ status: "cancelled", cancellation_reason: reason })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) throw new HttpError(500, updateError.message, updateError);

  await supabaseAdmin.rpc("recalculate_stock", { p_combustivel_id: current.combustivel_id });
  await supabaseAdmin.rpc("insert_audit_log", {
    p_acao: "cancel",
    p_entidade: "entrada_combustivel",
    p_entidade_id: id,
    p_dados_anteriores: current,
    p_dados_novos: updated,
    p_usuario_id: actorId,
    p_usuario_nome: actorName,
  });

  return updated;
}

export async function cancelExitData(id: string, reason: string, actorId: string, actorName: string) {
  const { data: current, error: currentError } = await supabaseAdmin
    .from("saidas_combustivel")
    .select("*")
    .eq("id", id)
    .single();

  if (currentError) throw new HttpError(404, "Saida nao encontrada.", currentError);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("saidas_combustivel")
    .update({ status: "cancelled", cancellation_reason: reason })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) throw new HttpError(500, updateError.message, updateError);

  await supabaseAdmin.rpc("recalculate_stock", { p_combustivel_id: current.combustivel_id });
  await supabaseAdmin.rpc("insert_audit_log", {
    p_acao: "cancel",
    p_entidade: "saida_combustivel",
    p_entidade_id: id,
    p_dados_anteriores: current,
    p_dados_novos: updated,
    p_usuario_id: actorId,
    p_usuario_nome: actorName,
  });

  return updated;
}


