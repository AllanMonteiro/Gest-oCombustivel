import { z } from "zod";

export const relatorioMovimentacoesSchema = z.object({
  dataInicial: z.string().optional(),
  dataFinal: z.string().optional(),
  combustivelId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  equipamentoId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  partnerName: z.string().optional(),
  status: z.enum(["active", "cancelled"]).optional(),
});

export type RelatorioMovimentacoesInput = z.infer<typeof relatorioMovimentacoesSchema>;