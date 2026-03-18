import type { Request, Response } from "express";
import { relatorioMovimentacoesSchema } from "../schemas/relatorio.schema.js";
import { exportRelatorioMovimentacoesCsvService, getRelatorioMovimentacoesService } from "../services/relatorios.service.js";

export async function getRelatorioMovimentacoesController(request: Request, response: Response) {
  const filters = relatorioMovimentacoesSchema.parse(request.query);
  const data = await getRelatorioMovimentacoesService(filters);
  return response.status(200).json(data);
}

export async function exportRelatorioMovimentacoesCsvController(request: Request, response: Response) {
  const filters = relatorioMovimentacoesSchema.parse(request.query);
  const csv = await exportRelatorioMovimentacoesCsvService(filters);
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", "attachment; filename=relatorio-movimentacoes.csv");
  return response.status(200).send(csv);
}