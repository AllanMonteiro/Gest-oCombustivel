import { supabaseAdmin } from "../config/supabase.js";
import { HttpError } from "../utils/http-error.js";

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

  if (error) throw new HttpError(500, error.message || "Erro ao criar area.", error);
  return area;
}

export async function getAreasData() {
  const { data, error } = await supabaseAdmin
    .from("areas")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw new HttpError(500, error.message || "Erro ao buscar areas.", error);
  return data || [];
}
