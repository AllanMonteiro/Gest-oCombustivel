import { supabaseAdmin } from "../config/supabase.js";

export async function createProfileData(data: { nome: string; email: string; role: string; ativo: boolean }) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .insert([{
      nome: data.nome,
      email: data.email,
      role: data.role,
      ativo: data.ativo,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return profile;
}

export async function getProfilesData() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw error;
  return data || [];
}
