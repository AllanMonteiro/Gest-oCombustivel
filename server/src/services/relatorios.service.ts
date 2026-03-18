import type { RelatorioMovimentacoesInput } from "../schemas/relatorio.schema.js";
import { getRelatorioMovimentacoesData } from "../repositories/estoque.repository.js";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function getRelatorioMovimentacoesService(filters: RelatorioMovimentacoesInput) {
  const { entries, exits } = await getRelatorioMovimentacoesData(filters);

  const totalEntradasLitros = entries.reduce((sum, item) => sum + Number(item.litros ?? 0), 0);
  const totalSaidasLitros = exits.reduce((sum, item) => sum + Number(item.litros ?? 0), 0);

  return {
    filtros: filters,
    totalizadores: {
      totalEntradasLitros,
      totalSaidasLitros,
    },
    entradas: entries,
    saidas: exits,
  };
}

export async function exportRelatorioMovimentacoesCsvService(filters: RelatorioMovimentacoesInput) {
  const relatorio = await getRelatorioMovimentacoesService(filters);
  const header = ["tipo", "data", "combustivel", "litros", "status", "responsavel", "area", "equipamento", "parceiro"];

  const rows = [
    ...relatorio.entradas.map((item) => [
      "entrada",
      item.data,
      item.combustivel_nome,
      item.litros,
      item.status,
      item.created_by_nome,
      "",
      "",
      item.partner_name ?? "",
    ]),
    ...relatorio.saidas.map((item) => [
      "saida",
      item.data,
      item.combustivel_nome,
      item.litros,
      item.status,
      item.usuario_nome || item.created_by_nome,
      item.area_nome ?? "",
      item.equipamento_nome ?? "",
      item.partner_name ?? "",
    ]),
  ];

  return [header, ...rows].map((line) => line.map(csvEscape).join(",")).join("\n");
}