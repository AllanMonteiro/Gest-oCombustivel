import { supabaseAdmin } from "../config/supabase.js";
import { HttpError } from "../utils/http-error.js";

export async function createEquipamentoData(data: { nome: string; tipo: string; area_padrao_id?: string; area_padrao_nome?: string; ativo: boolean }) {
  const { data: equip, error } = await supabaseAdmin
    .from("equipamentos")
    .insert([{
      nome: data.nome,
      tipo: data.tipo,
      area_padrao_id: data.area_padrao_id || null,
      area_padrao_nome: data.area_padrao_nome || null,
      ativo: data.ativo,
    }])
    .select()
    .single();

  if (error) throw new HttpError(500, error.message || "Erro ao criar equipamento.", error);
  return equip;
}

export async function getEquipamentosData() {
  const { data, error } = await supabaseAdmin
    .from("equipamentos")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw new HttpError(500, error.message || "Erro ao buscar equipamentos.", error);
  return data || [];
}
