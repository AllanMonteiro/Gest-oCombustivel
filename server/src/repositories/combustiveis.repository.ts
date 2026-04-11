import { supabaseAdmin } from "../config/supabase.js";

export async function createCombustivelData(data: { nome: string; codigo: string; unidade: string; ativo: boolean }) {
  const { data: fuel, error } = await supabaseAdmin
    .from("combustiveis")
    .insert([{
      nome: data.nome,
      codigo: data.codigo,
      unidade: data.unidade,
      ativo: data.ativo,
    }])
    .select()
    .single();

  if (error) {
    console.error(`[CORTEX] Erro ao criar combustivel na tabela 'combustiveis':`, error);
    throw error;
  }
  return fuel;
}

export async function getCombustiveisData() {
  const { data, error } = await supabaseAdmin
    .from("combustiveis")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data || [];
}
