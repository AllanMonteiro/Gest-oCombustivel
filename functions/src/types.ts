export interface EstoqueCombustivelRecord {
  combustivel_id: string;
  combustivel_nome: string;
  total_litros: number;
  custo_medio: number;
  valor_total_estoque: number;
  updated_at?: unknown;
}

export interface PartnerLoanSummary {
  partnerName: string;
  litrosEmprestadosPorParceiros: number;
  litrosDevolvidosAParceiros: number;
  litrosEmprestadosPorNos: number;
  litrosDevolvidosParaNos: number;
  saldoDevendo: number;
  saldoAReceber: number;
}

export interface FuelSummarySnapshot {
  totalStockLiters: number;
  totalEstimatedValue: number;
  stockItems: EstoqueCombustivelRecord[];
  totalLoanInLiters: number;
  totalLoanOutLiters: number;
  totalOwedLiters: number;
  partnerBalances: PartnerLoanSummary[];
  generatedAtIso: string;
}

export type FuelSummaryFrequency = "daily" | "weekly" | "monthly";

export interface FuelSummaryEmailSettings {
  enabled: boolean;
  recipients: string[];
  scheduleLabel: string;
  frequency: FuelSummaryFrequency;
  updatedAtIso: string | null;
}
