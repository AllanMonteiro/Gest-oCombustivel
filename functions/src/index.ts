import type { Response } from "express";
import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  FUEL_SUMMARY_RECIPIENTS_SECRET,
  FUEL_SUMMARY_TEST_TOKEN_SECRET,
  SMTP_CONFIG_SECRET,
} from "./config/secrets";
import {
  getFuelSummaryEmailSettings,
  saveFuelSummaryEmailSettings,
} from "./repositories/firestore/fuel-summary-email-settings.repository";
import { buildFuelSummaryEmail, getFuelSummarySnapshot } from "./services/dashboard/fuel-summary.service";
import { sendMailFromSecret } from "./services/shared/mail.service";
import type { FuelSummaryFrequency } from "./types";

interface SettingsBody {
  enabled?: boolean;
  recipients?: string[];
  scheduleLabel?: string;
  frequency?: FuelSummaryFrequency;
}

function applyCors(response: Response) {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Headers", "Content-Type, x-summary-token");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function parseRecipients(rawRecipients: string) {
  return rawRecipients
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeRecipients(recipients: unknown) {
  if (!Array.isArray(recipients)) return [];

  return recipients
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeFrequency(value: unknown): FuelSummaryFrequency {
  if (value === "weekly" || value === "monthly") return value;
  return "daily";
}

function assertToken(providedToken: string | undefined) {
  const expectedToken = FUEL_SUMMARY_TEST_TOKEN_SECRET.value();
  return Boolean(providedToken && providedToken === expectedToken);
}

function getLocalParts(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    day: "numeric",
  });

  const parts = formatter.formatToParts(new Date());
  const weekday = parts.find((item) => item.type === "weekday")?.value ?? "Mon";
  const day = Number(parts.find((item) => item.type === "day")?.value ?? "1");
  return { weekday, day };
}

function shouldSendToday(frequency: FuelSummaryFrequency, timeZone: string) {
  const { weekday, day } = getLocalParts(timeZone);

  if (frequency === "daily") return true;
  if (frequency === "weekly") return weekday === "Mon";
  return day === 1;
}

async function resolveRecipients() {
  const settings = await getFuelSummaryEmailSettings();

  if (settings.enabled && settings.recipients.length > 0) {
    return settings.recipients;
  }

  return parseRecipients(FUEL_SUMMARY_RECIPIENTS_SECRET.value());
}

async function dispatchFuelSummaryEmail() {
  const recipients = await resolveRecipients();

  if (!recipients.length) {
    throw new Error("Nenhum destinatario foi configurado para o resumo automatico.");
  }

  const snapshot = await getFuelSummarySnapshot();
  const email = buildFuelSummaryEmail(snapshot);

  await sendMailFromSecret(SMTP_CONFIG_SECRET.value(), {
    to: recipients,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  logger.info("Resumo automatico de combustivel enviado com sucesso.", {
    recipients,
    totalStockLiters: snapshot.totalStockLiters,
    totalLoanInLiters: snapshot.totalLoanInLiters,
    totalLoanOutLiters: snapshot.totalLoanOutLiters,
  });

  return {
    recipients,
    snapshot,
  };
}

export const sendFuelSummaryEmailDaily = onSchedule(
  {
    schedule: "0 7 * * *",
    timeZone: "America/Fortaleza",
    region: "southamerica-east1",
    secrets: [SMTP_CONFIG_SECRET, FUEL_SUMMARY_RECIPIENTS_SECRET],
  },
  async () => {
    const settings = await getFuelSummaryEmailSettings();

    if (!settings.enabled) {
      logger.info("Resumo automatico desabilitado nas configuracoes.");
      return;
    }

    if (!shouldSendToday(settings.frequency, "America/Fortaleza")) {
      logger.info("Hoje nao corresponde a frequencia configurada para o resumo.", {
        frequency: settings.frequency,
      });
      return;
    }

    await dispatchFuelSummaryEmail();
  },
);

export const getFuelSummaryEmailSettingsHttp = onRequest(
  {
    region: "southamerica-east1",
    secrets: [FUEL_SUMMARY_TEST_TOKEN_SECRET],
  },
  async (request, response) => {
    applyCors(response);

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    const providedToken = request.get("x-summary-token") ?? (typeof request.query.token === "string" ? request.query.token : undefined);
    if (!assertToken(providedToken)) {
      response.status(401).json({ message: "Token invalido." });
      return;
    }

    const settings = await getFuelSummaryEmailSettings();
    response.status(200).json(settings);
  },
);

export const saveFuelSummaryEmailSettingsHttp = onRequest(
  {
    region: "southamerica-east1",
    secrets: [FUEL_SUMMARY_TEST_TOKEN_SECRET],
  },
  async (request, response) => {
    applyCors(response);

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ message: "Metodo nao permitido." });
      return;
    }

    const providedToken = request.get("x-summary-token") ?? undefined;
    if (!assertToken(providedToken)) {
      response.status(401).json({ message: "Token invalido." });
      return;
    }

    const body = (request.body ?? {}) as SettingsBody;
    const saved = await saveFuelSummaryEmailSettings({
      enabled: body.enabled !== false,
      recipients: sanitizeRecipients(body.recipients),
      scheduleLabel: typeof body.scheduleLabel === "string" && body.scheduleLabel.trim() ? body.scheduleLabel.trim() : "07:00",
      frequency: sanitizeFrequency(body.frequency),
      updatedAtIso: null,
    });

    response.status(200).json({
      message: "Configuracao de email salva com sucesso.",
      settings: saved,
    });
  },
);

export const sendFuelSummaryEmailNow = onRequest(
  {
    region: "southamerica-east1",
    secrets: [SMTP_CONFIG_SECRET, FUEL_SUMMARY_RECIPIENTS_SECRET, FUEL_SUMMARY_TEST_TOKEN_SECRET],
  },
  async (request, response) => {
    applyCors(response);

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    const providedToken = request.get("x-summary-token") ?? (typeof request.query.token === "string" ? request.query.token : undefined);
    if (!assertToken(providedToken)) {
      response.status(401).json({ message: "Token invalido." });
      return;
    }

    try {
      const result = await dispatchFuelSummaryEmail();
      response.status(200).json({
        message: "Resumo enviado com sucesso.",
        recipients: result.recipients,
        generatedAtIso: result.snapshot.generatedAtIso,
      });
    } catch (error) {
      logger.error("Falha ao enviar resumo de combustivel.", error);
      response.status(500).json({
        message: "Falha ao enviar resumo.",
      });
    }
  },
);
