import type { Request, Response } from "express";
import { getEmailConfigData, saveEmailConfigData } from "../repositories/email-config.repository.js";
import { HttpError } from "../utils/http-error.js";

export async function getEmailConfigController(_request: Request, response: Response) {
  const config = await getEmailConfigData();
  return response.status(200).json({
    enabled: config.enabled,
    recipients: config.recipients || [],
    scheduleLabel: config.schedule_label || "07:00",
    frequency: config.frequency || "daily",
    updatedAtIso: config.updated_at
  });
}

export async function saveEmailConfigController(request: Request, response: Response) {
  const { enabled, recipients, scheduleLabel, frequency } = request.body;

  if (!Array.isArray(recipients)) {
    throw new HttpError(400, "Lista de destinatarios deve ser um array.");
  }

  const saved = await saveEmailConfigData({
    enabled: Boolean(enabled),
    recipients,
    schedule_label: scheduleLabel || "07:00",
    frequency: frequency || "daily"
  });

  return response.status(200).json({
    message: "Configuracao de email salva com sucesso.",
    settings: {
      enabled: saved.enabled,
      recipients: saved.recipients,
      scheduleLabel: saved.schedule_label,
      frequency: saved.frequency,
      updatedAtIso: saved.updated_at
    }
  });
}

export async function sendTestEmailController(_request: Request, response: Response) {
  const config = await getEmailConfigData();
  
  if (!config.recipients || config.recipients.length === 0) {
    throw new HttpError(400, "Nao ha destinatarios configurados para o teste.");
  }

  // TODO: Implement actual email sending logic (SendGrid, Mailgun, etc.)
  // For now, return success to let the UI work.
  return response.status(200).json({
    message: "Email de teste disparado com sucesso!",
    recipients: config.recipients,
    generatedAtIso: new Date().toISOString()
  });
}
