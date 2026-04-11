import { supabaseAdmin } from "../config/supabase.js";

export async function createEquipamentoData(data: { nome: string; tipo: string; area_padrao?: string; ativo: boolean }) {
  const { data: equip, error } = await supabaseAdmin
    .from("equipamentos")
    .insert([{
      nome: data.nome,
      tipo: data.tipo,
      area_padrao: data.area_padrao,
      ativo: data.ativo,
    }])
    .select()
    .single();

  if (error) {
    console.error(`[CORTEX] Erro ao criar equipamento na tabela 'equipamentos':`, error);
    throw error;
  }
  return equip;
}

export async function getEquipamentosData() {
  const { data, error } = await supabaseAdmin
    .from("equipamentos")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data || [];
}
