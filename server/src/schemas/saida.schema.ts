import { z } from "zod";

export const createSaidaSchema = z.object({
  data: z.string().min(1),
  combustivel: z.string().min(1),
  litros: z.coerce.number().positive(),
  usuarioId: z.string().uuid().optional(),
  usuarioNome: z.string().optional(),
  areaId: z.string().uuid().optional(),
  areaNome: z.string().optional(),
  equipamentoId: z.string().uuid().optional(),
  equipamentoNome: z.string().optional(),
  observacao: z.string().optional(),
  movementType: z.enum(["regular", "loan_out", "return_out"]).default("regular"),
  partnerName: z.string().optional(),
}).superRefine((data, context) => {
  if (data.movementType === "regular") {
    if (!data.usuarioNome) context.addIssue({ code: z.ZodIssueCode.custom, path: ["usuarioNome"], message: "Usuario obrigatorio." });
    if (!data.areaNome) context.addIssue({ code: z.ZodIssueCode.custom, path: ["areaNome"], message: "Area obrigatoria." });
    if (!data.equipamentoNome) context.addIssue({ code: z.ZodIssueCode.custom, path: ["equipamentoNome"], message: "Equipamento obrigatorio." });
  }
});

export const cancelMovementSchema = z.object({
  reason: z.string().min(3),
});

export type CreateSaidaInput = z.infer<typeof createSaidaSchema>;
export type CancelMovementInput = z.infer<typeof cancelMovementSchema>;