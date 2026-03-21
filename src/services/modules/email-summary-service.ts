export type EmailSummaryFrequency = "daily" | "weekly" | "monthly";

export interface EmailSummaryApiSettings {
  enabled: boolean;
  recipients: string[];
  scheduleLabel: string;
  frequency: EmailSummaryFrequency;
  updatedAtIso: string | null;
}

export interface EmailSummaryConnectionSettings {
  baseUrl: string;
  adminToken: string;
}

function joinUrl(baseUrl: string, endpoint: string) {
  return `${baseUrl.replace(/\/$/, "")}/${endpoint}`;
}

function buildHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

export async function fetchEmailSummarySettings(connection: EmailSummaryConnectionSettings) {
  const response = await fetch(joinUrl(connection.baseUrl, "getFuelSummaryEmailSettingsHttp"), {
    method: "GET",
    headers: buildHeaders(connection.adminToken),
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar a configuracao de email.");
  }

  return (await response.json()) as EmailSummaryApiSettings;
}

export async function saveEmailSummarySettings(
  connection: EmailSummaryConnectionSettings,
  settings: EmailSummaryApiSettings,
) {
  const response = await fetch(joinUrl(connection.baseUrl, "saveFuelSummaryEmailSettingsHttp"), {
    method: "POST",
    headers: buildHeaders(connection.adminToken),
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel salvar a configuracao de email.");
  }

  return (await response.json()) as { message: string; settings: EmailSummaryApiSettings };
}

export async function sendEmailSummaryTest(connection: EmailSummaryConnectionSettings) {
  const response = await fetch(joinUrl(connection.baseUrl, "sendFuelSummaryEmailNow"), {
    method: "GET",
    headers: buildHeaders(connection.adminToken),
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel disparar o email de teste.");
  }

  return (await response.json()) as {
    message: string;
    recipients: string[];
    generatedAtIso: string;
  };
}
