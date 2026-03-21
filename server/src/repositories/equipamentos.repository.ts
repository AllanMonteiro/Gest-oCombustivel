import { supabaseAdmin } from "../config/supabase.js";

export async function createEquipamentoData(data: { nome: string; tipo: string; area_padrao?: string; ativo: boolean }) {
  const { data: equip, error } = await supabaseAdmin
    .from("equipamentos")
    .insert([{
      nome: data.nome,
      tipo: data.tipo,
      area_padrao: data.area_padrao,
      ativo: data.ativo,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
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
