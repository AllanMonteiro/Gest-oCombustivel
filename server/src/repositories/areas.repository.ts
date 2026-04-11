import { supabaseAdmin } from "../config/supabase.js";

export async function createAreaData(data: { nome: string; descricao?: string; ativo: boolean }) {
  const { data: area, error } = await supabaseAdmin
    .from("areas")
    .insert([{
      nome: data.nome,
      descricao: data.descricao,
      ativo: data.ativo,
    }])
    .select()
    .single();

  if (error) {
    console.error(`[CORTEX] Erro ao criar area na tabela 'areas':`, error);
    throw error;
  }
  return area;
}

export async function getAreasData() {
  const { data, error } = await supabaseAdmin
    .from("areas")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data || [];
}
