import { z } from "zod";

export const dashboardFiltersSchema = z.object({
  dataInicial: z.string().optional(),
  dataFinal: z.string().optional(),
  combustivelId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  equipamentoId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  partnerName: z.string().optional(),
});

export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;