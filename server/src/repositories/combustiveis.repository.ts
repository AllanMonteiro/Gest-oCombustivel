import { supabaseAdmin } from "../config/supabase.js";
import { HttpError } from "../utils/http-error.js";

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

  if (error) throw new HttpError(500, error.message || "Erro ao criar combustivel.", error);
  return fuel;
}

export async function getCombustiveisData() {
  const { data, error } = await supabaseAdmin
    .from("combustiveis")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw new HttpError(500, error.message || "Erro ao buscar combustiveis.", error);
  return data || [];
}
