import { supabaseAdmin } from "../config/supabase.js";
import type { CreateInventoryEntryInput, CreateInventoryExitInput, CreateInventoryProductInput } from "../schemas/inventario.schema.js";
import { HttpError } from "../utils/http-error.js";

async function getProductById(produtoId: string) {
  const { data, error } = await supabaseAdmin
    .from("produtos_gerais")
    .select("*")
    .eq("id", produtoId)
    .eq("ativo", true)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message, error);
  if (!data) throw new HttpError(404, "Produto nao encontrado.");
  return data;
}

export async function getInventoryStateData() {
  const [{ data: products, error: productsError }, { data: stock, error: stockError }, { data: entries, error: entriesError }, { data: exits, error: exitsError }] = await Promise.all([
    supabaseAdmin.from("produtos_gerais").select("*").order("nome", { ascending: true }),
    supabaseAdmin.from("estoque_produtos").select("*").order("produto_nome", { ascending: true }),
    supabaseAdmin.from("entradas_produtos").select("*").order("data", { ascending: false }),
    supabaseAdmin.from("saidas_produtos").select("*").order("data", { ascending: false }),
  ]);

  if (productsError) throw new HttpError(500, productsError.message, productsError);
  if (stockError) throw new HttpError(500, stockError.message, stockError);
  if (entriesError) throw new HttpError(500, entriesError.message, entriesError);
  if (exitsError) throw new HttpError(500, exitsError.message, exitsError);

  return {
    products: products ?? [],
    stock: stock ?? [],
    entries: entries ?? [],
    exits: exits ?? [],
  };
}

export async function createInventoryProductData(payload: CreateInventoryProductInput, actorId: string, actorName: string) {
  const insertPayload = {
    nome: payload.nome,
    categoria: payload.categoria,
    unidade: payload.unidade,
    area_responsavel: payload.areaResponsavel,
    estoque_minimo: payload.estoqueMinimo,
    descricao: payload.descricao,
    ativo: payload.ativo,
  };

  const { data, error } = await supabaseAdmin
    .from("produtos_gerais")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw new HttpError(400, error.message, error);

  await supabaseAdmin.rpc("recalculate_product_stock", { p_produto_id: data.id });
  await supabaseAdmin.rpc("insert_audit_log", {
    p_acao: "create",
    p_entidade: "produto_geral",
    p_entidade_id: data.id,
    p_dados_anteriores: null,
    p_dados_novos: data,
    p_usuario_id: actorId,
    p_usuario_nome: actorName,
  });

  return data;
}

export async function createInventoryEntryData(payload: CreateInventoryEntryInput, actorId: string, actorName: string) {
  const product = await getProductById(payload.produtoId);

  const insertPayload = {
    data: payload.data,
    produto_id: payload.produtoId,
    quantidade: payload.quantidade,
    custo_unitario: payload.custoUnitario,
    fornecedor: payload.fornecedor,
    nota_fiscal: payload.notaFiscal,
    observacao: payload.observacao,
    created_by_id: actorId,
    created_by_nome: actorName,
  };

  const { data, error } = await supabaseAdmin
    .from("entradas_produtos")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw new HttpError(400, error.message, error);

  await supabaseAdmin.rpc("recalculate_product_stock", { p_produto_id: product.id });
  await supabaseAdmin.rpc("insert_audit_log", {
    p_acao: "create",
    p_entidade: "entrada_produto",
    p_entidade_id: data.id,
    p_dados_anteriores: null,
    p_dados_novos: data,
    p_usuario_id: actorId,
    p_usuario_nome: actorName,
  });

  return data;
}

export async function createInventoryExitData(payload: CreateInventoryExitInput, actorId: string, actorName: string) {
  const product = await getProductById(payload.produtoId);

  const { data: stockRow, error: stockError } = await supabaseAdmin
    .from("estoque_produtos")
    .select("saldo_atual")
    .eq("produto_id", payload.produtoId)
    .maybeSingle();

  if (stockError) throw new HttpError(500, stockError.message, stockError);

  const saldoAtual = Number(stockRow?.saldo_atual ?? 0);
  if (payload.quantidade > saldoAtual) {
    throw new HttpError(400, `Saldo insuficiente para ${product.nome}. Disponivel: ${saldoAtual.toLocaleString("pt-BR")} ${product.unidade}`);
  }

  const insertPayload = {
    data: payload.data,
    produto_id: payload.produtoId,
    quantidade: payload.quantidade,
    area: payload.area,
    equipamento: payload.equipamento,
    solicitante: payload.solicitante,
    aplicacao: payload.aplicacao,
    observacao: payload.observacao,
    created_by_id: actorId,
    created_by_nome: actorName,
  };

  const { data, error } = await supabaseAdmin
    .from("saidas_produtos")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw new HttpError(400, error.message, error);

  await supabaseAdmin.rpc("recalculate_product_stock", { p_produto_id: product.id });
  await supabaseAdmin.rpc("insert_audit_log", {
    p_acao: "create",
    p_entidade: "saida_produto",
    p_entidade_id: data.id,
    p_dados_anteriores: null,
    p_dados_novos: data,
    p_usuario_id: actorId,
    p_usuario_nome: actorName,
  });

  return data;
}
