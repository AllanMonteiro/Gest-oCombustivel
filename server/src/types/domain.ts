export type AppRole = "admin" | "operador" | "gestor";
export type MovementStatus = "active" | "cancelled";
export type EntryMovementType = "regular" | "loan_in" | "return_in";
export type ExitMovementType = "regular" | "loan_out" | "return_out";

export interface ActorContext {
  id: string;
  nome: string;
  role: AppRole;
}

export interface DashboardFilters {
  dataInicial?: string;
  dataFinal?: string;
  combustivelId?: string;
  areaId?: string;
  equipamentoId?: string;
  usuarioId?: string;
  partnerName?: string;
}