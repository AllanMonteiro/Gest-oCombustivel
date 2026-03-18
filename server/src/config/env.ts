import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  APP_URL: z.string().url().default("http://localhost:5173"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  EMAIL_SUMMARY_ENABLED: z.string().optional(),
  EMAIL_SUMMARY_FREQUENCY: z.enum(["daily", "weekly", "monthly"]).optional(),
  EMAIL_SUMMARY_RECIPIENTS: z.string().optional(),
});

export const env = envSchema.parse(process.env);