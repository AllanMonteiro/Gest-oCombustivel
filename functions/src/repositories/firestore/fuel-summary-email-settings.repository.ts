import { db } from "../../config/firebase";
import type { FuelSummaryEmailSettings } from "../../types";

const EMAIL_SETTINGS_COLLECTION = "system_config";
const EMAIL_SETTINGS_DOC = "fuel_summary_email";

function sanitizeRecipients(recipients: unknown) {
  if (!Array.isArray(recipients)) return [];

  return recipients
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeFrequency(value: unknown): FuelSummaryEmailSettings["frequency"] {
  if (value === "weekly" || value === "monthly") return value;
  return "daily";
}

export async function getFuelSummaryEmailSettings(): Promise<FuelSummaryEmailSettings> {
  const snapshot = await db.collection(EMAIL_SETTINGS_COLLECTION).doc(EMAIL_SETTINGS_DOC).get();
  const data = snapshot.data() ?? {};

  return {
    enabled: data.enabled !== false,
    recipients: sanitizeRecipients(data.recipients),
    scheduleLabel: typeof data.scheduleLabel === "string" && data.scheduleLabel.trim() ? data.scheduleLabel : "07:00",
    frequency: sanitizeFrequency(data.frequency),
    updatedAtIso: typeof data.updatedAtIso === "string" ? data.updatedAtIso : null,
  };
}

export async function saveFuelSummaryEmailSettings(settings: FuelSummaryEmailSettings) {
  const payload: FuelSummaryEmailSettings = {
    enabled: settings.enabled,
    recipients: sanitizeRecipients(settings.recipients),
    scheduleLabel: settings.scheduleLabel || "07:00",
    frequency: sanitizeFrequency(settings.frequency),
    updatedAtIso: new Date().toISOString(),
  };

  await db.collection(EMAIL_SETTINGS_COLLECTION).doc(EMAIL_SETTINGS_DOC).set(payload, { merge: true });

  return payload;
}
