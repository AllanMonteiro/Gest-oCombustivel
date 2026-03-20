import { z } from "zod";

export const createInventoryProductSchema = z.object({
  nome: z.string().min(2),
  categoria: z.enum(["Pecas", "Movelaria", "Material eletrico", "Ferramentas", "EPI", "Outros"]),
  unidade: z.string().min(1),
  areaResponsavel: z.string().min(2),
  estoqueMinimo: z.coerce.number().min(0),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
});

export const createInventoryEntrySchema = z.object({
  data: z.string().min(1),
  produtoId: z.string().uuid(),
  quantidade: z.coerce.number().positive(),
  custoUnitario: z.coerce.number().min(0),
  fornecedor: z.string().min(2),
  notaFiscal: z.string().optional(),
  observacao: z.string().optional(),
});

export const createInventoryExitSchema = z.object({
  data: z.string().min(1),
  produtoId: z.string().uuid(),
  quantidade: z.coerce.number().positive(),
  area: z.string().min(2),
  equipamento: z.string().optional(),
  solicitante: z.string().min(2),
  aplicacao: z.string().optional(),
  observacao: z.string().optional(),
});

export type CreateInventoryProductInput = z.infer<typeof createInventoryProductSchema>;
export type CreateInventoryEntryInput = z.infer<typeof createInventoryEntrySchema>;
export type CreateInventoryExitInput = z.infer<typeof createInventoryExitSchema>;
