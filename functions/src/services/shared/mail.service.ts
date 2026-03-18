import nodemailer from "nodemailer";
import { z } from "zod";

const smtpConfigSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive(),
  secure: z.coerce.boolean().optional().default(false),
  user: z.string().min(1),
  pass: z.string().min(1),
  from: z.string().email(),
});

export interface MailPayload {
  to: string[];
  subject: string;
  text: string;
  html: string;
}

export async function sendMailFromSecret(smtpSecretRaw: string, payload: MailPayload) {
  const parsedSecret = smtpConfigSchema.parse(JSON.parse(smtpSecretRaw));

  const transporter = nodemailer.createTransport({
    host: parsedSecret.host,
    port: parsedSecret.port,
    secure: parsedSecret.secure,
    auth: {
      user: parsedSecret.user,
      pass: parsedSecret.pass,
    },
  });

  await transporter.sendMail({
    from: parsedSecret.from,
    to: payload.to.join(", "),
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}
