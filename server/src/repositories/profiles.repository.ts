import { supabaseAdmin } from "../config/supabase.js";
import { HttpError } from "../utils/http-error.js";

export async function createProfileData(data: { nome: string; email: string; role: string; ativo: boolean }) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    user_metadata: { nome: data.nome, role: data.role },
    email_confirm: true,
  });

  if (authError) throw new HttpError(400, authError.message);

  // The on_auth_user_created trigger populates public.users automatically.
  // Update ativo if requested as inactive.
  if (!data.ativo) {
    await supabaseAdmin.from("users").update({ ativo: false }).eq("id", authData.user.id);
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (error) throw new HttpError(500, error.message || "Erro ao buscar usuario criado.");
  return user;
}

export async function getProfilesData() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw new HttpError(500, error.message || "Erro ao buscar usuarios.");
  return data || [];
}
