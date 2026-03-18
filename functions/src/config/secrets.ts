import { defineSecret } from "firebase-functions/params";

export const SMTP_CONFIG_SECRET = defineSecret("SMTP_CONFIG");
export const FUEL_SUMMARY_RECIPIENTS_SECRET = defineSecret("FUEL_SUMMARY_RECIPIENTS");
export const FUEL_SUMMARY_TEST_TOKEN_SECRET = defineSecret("FUEL_SUMMARY_TEST_TOKEN");
