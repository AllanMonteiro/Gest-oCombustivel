import { getDashboardBaseData } from "../repositories/estoque.repository.js";
import type { DashboardFiltersInput } from "../schemas/dashboard.schema.js";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export async function getDashboardDataService(filters: DashboardFiltersInput) {
  const { stock, entries, exits } = await getDashboardBaseData(filters);

  const totalStockLiters = stock.reduce((sum, item) => sum + Number(item.total_litros ?? 0), 0);
  const totalEstimatedValue = stock.reduce((sum, item) => sum + Number(item.valor_total_estoque ?? 0), 0);
  const totalLoanInLiters = entries.filter((item) => item.status === "active" && item.movement_type === "loan_in").reduce((sum, item) => sum + Number(item.litros ?? 0), 0);
  const totalLoanOutLiters = exits.filter((item) => item.status === "active" && item.movement_type === "loan_out").reduce((sum, item) => sum + Number(item.litros ?? 0), 0);

  const consumoPorArea = Object.values(exits.filter((item) => item.status === "active" && item.movement_type === "regular").reduce<Record<string, { areaNome: string; litros: number }>>((acc, item) => {
    const key = item.area_nome || "Sem area";
    acc[key] ??= { areaNome: key, litros: 0 };
    acc[key].litros += Number(item.litros ?? 0);
    return acc;
  }, {})).map((item) => ({ ...item, litros: round(item.litros) }));

  const consumoPorEquipamento = Object.values(exits.filter((item) => item.status === "active" && item.movement_type === "regular").reduce<Record<string, { equipamentoNome: string; litros: number }>>((acc, item) => {
    const key = item.equipamento_nome || "Sem equipamento";
    acc[key] ??= { equipamentoNome: key, litros: 0 };
    acc[key].litros += Number(item.litros ?? 0);
    return acc;
  }, {})).map((item) => ({ ...item, litros: round(item.litros) }));

  const evolucaoTemporal = Object.values(exits.filter((item) => item.status === "active").reduce<Record<string, { data: string; litros: number }>>((acc, item) => {
    const key = item.data;
    acc[key] ??= { data: key, litros: 0 };
    acc[key].litros += Number(item.litros ?? 0);
    return acc;
  }, {})).sort((a, b) => a.data.localeCompare(b.data)).map((item) => ({ ...item, litros: round(item.litros) }));

  return {
    indicadores: {
      totalStockLiters: round(totalStockLiters),
      totalEstimatedValue: round(totalEstimatedValue),
      totalLoanInLiters: round(totalLoanInLiters),
      totalLoanOutLiters: round(totalLoanOutLiters),
    },
    estoquePorCombustivel: stock,
    consumoPorArea,
    consumoPorEquipamento,
    evolucaoTemporal,
  };
}