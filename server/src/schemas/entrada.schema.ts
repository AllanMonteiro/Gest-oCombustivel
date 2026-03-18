import { z } from "zod";

export const createEntradaSchema = z.object({
  data: z.string().min(1),
  fornecedor: z.string().min(2),
  combustivel: z.string().min(1),
  litros: z.coerce.number().positive(),
  valorLitro: z.coerce.number().min(0),
  notaFiscal: z.string().optional(),
  observacao: z.string().optional(),
  movementType: z.enum(["regular", "loan_in", "return_in"]).default("regular"),
  partnerName: z.string().optional(),
});

export type CreateEntradaInput = z.infer<typeof createEntradaSchema>;