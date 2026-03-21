import { supabaseAdmin } from "../config/supabase.js";

export interface EmailConfig {
  enabled: boolean;
  recipients: string[];
  schedule_label: string;
  frequency: "daily" | "weekly" | "monthly";
  updated_at: string;
}

export async function getEmailConfigData() {
  const { data, error } = await supabaseAdmin
    .from("email_configs")
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 is 'no rows'
  
  if (!data) {
    return {
      enabled: false,
      recipients: [],
      schedule_label: "07:00",
      frequency: "daily",
      updated_at: new Date().toISOString()
    } as EmailConfig;
  }

  return data as EmailConfig;
}

export async function saveEmailConfigData(config: Partial<EmailConfig>) {
  const { data: existing } = await supabaseAdmin
    .from("email_configs")
    .select("id")
    .single();

  const payload = {
    ...config,
    updated_at: new Date().toISOString()
  };

  let result;
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("email_configs")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabaseAdmin
      .from("email_configs")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    result = data;
  }

  return result as EmailConfig;
}
