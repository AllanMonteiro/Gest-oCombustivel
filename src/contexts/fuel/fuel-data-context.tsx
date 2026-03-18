import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { hasApiConfig } from "@/lib/config/env";
import {
  cancelEntradaApi,
  cancelSaidaApi,
  createEntradaApi,
  createSaidaApi,
  fetchOperationalState,
  updateEntradaApi,
  updateSaidaApi,
  type ApiActor,
  type RemoteEntryRecord,
  type RemoteExitRecord,
} from "@/services/modules/operational-api-service";

export type FuelType = "Diesel S10" | "Diesel S500" | "Gasolina" | "Etanol";
export type MovementStatus = "active" | "cancelled";
export type EntryMovementType = "regular" | "loan_in" | "return_in";
export type ExitMovementType = "regular" | "loan_out" | "return_out";

interface CancellationData {
  status: MovementStatus;
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface FuelEntryRecord extends CancellationData {
  id: string;
  data: string;
  fornecedor: string;
  combustivel: FuelType;
  litros: number;
  valorLitro: number;
  notaFiscal: string;
  observacao?: string;
  movementType: EntryMovementType;
  partnerName?: string;
}

export interface FuelExitRecord extends CancellationData {
  id: string;
  data: string;
  combustivel: FuelType;
  litros: number;
  usuarioNome: string;
  area: string;
  equipamento: string;
  requisicao?: string;
  observacao?: string;
  movementType: ExitMovementType;
  partnerName?: string;
}

export interface FuelStockItem {
  combustivel: FuelType;
  litrosEntrada: number;
  litrosSaida: number;
  saldoLitros: number;
  custoMedio: number;
  valorEstimado: number;
}

export interface PartnerBalanceItem {
  partnerName: string;
  litrosEmprestadosPorParceiros: number;
  litrosDevolvidosAParceiros: number;
  litrosEmprestadosPorNos: number;
  litrosDevolvidosParaNos: number;
  saldoDevendo: number;
  saldoAReceber: number;
}

interface FuelDataContextValue {
  entries: FuelEntryRecord[];
  exits: FuelExitRecord[];
  stockByFuel: FuelStockItem[];
  partnerBalances: PartnerBalanceItem[];
  totalStockLiters: number;
  totalExitLiters: number;
  totalEstimatedValue: number;
  totalLoanInLiters: number;
  totalLoanOutLiters: number;
  totalOwedLiters: number;
  isRemoteMode: boolean;
  isSyncing: boolean;
  syncError: string | null;
  addEntry: (entry: Omit<FuelEntryRecord, "id" | "status" | "cancellationReason" | "cancelledAt">) => Promise<void>;
  updateEntry: (id: string, entry: Omit<FuelEntryRecord, "id" | "status" | "cancellationReason" | "cancelledAt">) => Promise<void>;
  addExit: (exit: Omit<FuelExitRecord, "id" | "status" | "cancellationReason" | "cancelledAt">) => Promise<void>;
  updateExit: (id: string, exit: Omit<FuelExitRecord, "id" | "status" | "cancellationReason" | "cancelledAt">) => Promise<void>;
  cancelEntry: (id: string, reason: string) => Promise<void>;
  cancelExit: (id: string, reason: string) => Promise<void>;
  reloadData: () => Promise<void>;
}

const STORAGE_KEY = "controle-combustivel-local-data-v6";
const initialEntries: FuelEntryRecord[] = [];
const initialExits: FuelExitRecord[] = [];
const fuelTypes: FuelType[] = ["Diesel S10", "Diesel S500", "Gasolina", "Etanol"];
const FuelDataContext = createContext<FuelDataContextValue | null>(null);

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function activeEntries(entries: FuelEntryRecord[]) {
  return entries.filter((item) => item.status === "active");
}

function activeExits(exits: FuelExitRecord[]) {
  return exits.filter((item) => item.status === "active");
}

function buildStock(entries: FuelEntryRecord[], exits: FuelExitRecord[]) {
  const validEntries = activeEntries(entries);
  const validExits = activeExits(exits);

  return fuelTypes.map((combustivel) => {
    const fuelEntries = validEntries.filter((item) => item.combustivel === combustivel);
    const fuelExits = validExits.filter((item) => item.combustivel === combustivel);
    const regularPurchaseEntries = fuelEntries.filter((item) => item.movementType === "regular");

    const litrosEntrada = fuelEntries.reduce((sum, item) => sum + item.litros, 0);
    const litrosSaida = fuelExits.reduce((sum, item) => sum + item.litros, 0);
    const saldoLitros = Math.max(0, litrosEntrada - litrosSaida);
    const valorEntradaRegular = regularPurchaseEntries.reduce((sum, item) => sum + item.litros * item.valorLitro, 0);
    const litrosEntradaRegular = regularPurchaseEntries.reduce((sum, item) => sum + item.litros, 0);
    const custoMedio = litrosEntradaRegular > 0 ? valorEntradaRegular / litrosEntradaRegular : 0;

    return {
      combustivel,
      litrosEntrada: round(litrosEntrada),
      litrosSaida: round(litrosSaida),
      saldoLitros: round(saldoLitros),
      custoMedio: round(custoMedio),
      valorEstimado: round(saldoLitros * custoMedio),
    };
  });
}

function buildPartnerBalances(entries: FuelEntryRecord[], exits: FuelExitRecord[]) {
  const grouped = new Map<string, PartnerBalanceItem>();
  const ensure = (partnerName: string) => {
    if (!grouped.has(partnerName)) {
      grouped.set(partnerName, {
        partnerName,
        litrosEmprestadosPorParceiros: 0,
        litrosDevolvidosAParceiros: 0,
        litrosEmprestadosPorNos: 0,
        litrosDevolvidosParaNos: 0,
        saldoDevendo: 0,
        saldoAReceber: 0,
      });
    }
    return grouped.get(partnerName)!;
  };

  for (const item of activeEntries(entries)) {
    if (!item.partnerName) continue;
    const row = ensure(item.partnerName);
    if (item.movementType === "loan_in") row.litrosEmprestadosPorParceiros += item.litros;
    if (item.movementType === "return_in") row.litrosDevolvidosParaNos += item.litros;
  }

  for (const item of activeExits(exits)) {
    if (!item.partnerName) continue;
    const row = ensure(item.partnerName);
    if (item.movementType === "loan_out") row.litrosEmprestadosPorNos += item.litros;
    if (item.movementType === "return_out") row.litrosDevolvidosAParceiros += item.litros;
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      litrosEmprestadosPorParceiros: round(item.litrosEmprestadosPorParceiros),
      litrosDevolvidosAParceiros: round(item.litrosDevolvidosAParceiros),
      litrosEmprestadosPorNos: round(item.litrosEmprestadosPorNos),
      litrosDevolvidosParaNos: round(item.litrosDevolvidosParaNos),
      saldoDevendo: round(Math.max(item.litrosEmprestadosPorParceiros - item.litrosDevolvidosAParceiros, 0)),
      saldoAReceber: round(Math.max(item.litrosEmprestadosPorNos - item.litrosDevolvidosParaNos, 0)),
    }))
    .sort((a, b) => a.partnerName.localeCompare(b.partnerName));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEntries(entries: FuelEntryRecord[]) {
  return entries.map((item) => ({ ...item, status: item.status ?? "active", movementType: item.movementType ?? "regular" }));
}

function normalizeExits(exits: FuelExitRecord[]) {
  return exits.map((item) => ({ ...item, status: item.status ?? "active", movementType: item.movementType ?? "regular" }));
}

function toLocalEntry(item: RemoteEntryRecord): FuelEntryRecord {
  return {
    id: item.id,
    data: item.data,
    fornecedor: item.fornecedor,
    combustivel: item.combustivel_nome as FuelType,
    litros: Number(item.litros ?? 0),
    valorLitro: Number(item.valor_litro ?? 0),
    notaFiscal: item.nota_fiscal ?? "",
    observacao: item.observacao ?? undefined,
    movementType: item.movement_type,
    partnerName: item.partner_name ?? undefined,
    status: item.status,
    cancellationReason: item.cancellation_reason ?? undefined,
  };
}

function toLocalExit(item: RemoteExitRecord): FuelExitRecord {
  return {
    id: item.id,
    data: item.data,
    combustivel: item.combustivel_nome as FuelType,
    litros: Number(item.litros ?? 0),
    usuarioNome: item.usuario_nome ?? "",
    area: item.area_nome ?? "",
    equipamento: item.equipamento_nome ?? "",
    requisicao: item.requisicao ?? undefined,
    observacao: item.observacao ?? undefined,
    movementType: item.movement_type,
    partnerName: item.partner_name ?? undefined,
    status: item.status,
    cancellationReason: item.cancellation_reason ?? undefined,
  };
}

export function FuelDataProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, profile } = useAuth();
  const [entries, setEntries] = useState<FuelEntryRecord[]>(initialEntries);
  const [exits, setExits] = useState<FuelExitRecord[]>(initialExits);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const actor = useMemo<ApiActor | null>(() => {
    if (!profile) return null;
    return { id: profile.id, nome: profile.nome, role: profile.role };
  }, [profile]);

  const isRemoteMode = hasApiConfig && isAuthenticated && Boolean(actor);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { entries?: FuelEntryRecord[]; exits?: FuelExitRecord[] };
      if (parsed.entries) setEntries(normalizeEntries(parsed.entries));
      if (parsed.exits) setExits(normalizeExits(parsed.exits));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, exits }));
  }, [entries, exits]);

  const reloadData = async () => {
    if (!actor || !isRemoteMode) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const state = await fetchOperationalState(actor);
      setEntries(state.entries.map(toLocalEntry));
      setExits(state.exits.map(toLocalExit));
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Falha ao sincronizar dados operacionais.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!isRemoteMode) return;
    void reloadData();
  }, [isRemoteMode, actor?.id]);

  const stockByFuel = useMemo(() => buildStock(entries, exits), [entries, exits]);
  const partnerBalances = useMemo(() => buildPartnerBalances(entries, exits), [entries, exits]);
  const totalStockLiters = useMemo(() => round(stockByFuel.reduce((sum, item) => sum + item.saldoLitros, 0)), [stockByFuel]);
  const totalExitLiters = useMemo(() => round(activeExits(exits).reduce((sum, item) => sum + item.litros, 0)), [exits]);
  const totalEstimatedValue = useMemo(() => round(stockByFuel.reduce((sum, item) => sum + item.valorEstimado, 0)), [stockByFuel]);
  const totalLoanInLiters = useMemo(() => round(activeEntries(entries).filter((item) => item.movementType === "loan_in").reduce((sum, item) => sum + item.litros, 0)), [entries]);
  const totalLoanOutLiters = useMemo(() => round(activeExits(exits).filter((item) => item.movementType === "loan_out").reduce((sum, item) => sum + item.litros, 0)), [exits]);
  const totalOwedLiters = useMemo(() => round(partnerBalances.reduce((sum, item) => sum + item.saldoDevendo, 0)), [partnerBalances]);

  const value = useMemo<FuelDataContextValue>(() => ({
    entries,
    exits,
    stockByFuel,
    partnerBalances,
    totalStockLiters,
    totalExitLiters,
    totalEstimatedValue,
    totalLoanInLiters,
    totalLoanOutLiters,
    totalOwedLiters,
    isRemoteMode,
    isSyncing,
    syncError,
    addEntry: async (entry) => {
      if (isRemoteMode && actor) {
        await createEntradaApi(actor, {
          data: entry.data,
          fornecedor: entry.fornecedor,
          combustivel: entry.combustivel,
          litros: entry.litros,
          valorLitro: entry.valorLitro,
          notaFiscal: entry.notaFiscal,
          observacao: entry.observacao,
          movementType: entry.movementType,
          partnerName: entry.partnerName,
        });
        await reloadData();
        return;
      }

      setEntries((current) => [{ ...entry, id: createId("ent"), status: "active" }, ...current]);
    },
    updateEntry: async (id, entry) => {
      if (isRemoteMode && actor) {
        await updateEntradaApi(actor, id, {
          data: entry.data,
          fornecedor: entry.fornecedor,
          combustivel: entry.combustivel,
          litros: entry.litros,
          valorLitro: entry.valorLitro,
          notaFiscal: entry.notaFiscal,
          observacao: entry.observacao,
          movementType: entry.movementType,
          partnerName: entry.partnerName,
        });
        await reloadData();
        return;
      }

      setEntries((current) => current.map((item) => item.id === id ? { ...item, ...entry } : item));
    },
    addExit: async (exit) => {
      if (isRemoteMode && actor) {
        await createSaidaApi(actor, {
          data: exit.data,
          combustivel: exit.combustivel,
          litros: exit.litros,
          usuarioNome: exit.usuarioNome,
          areaNome: exit.area,
          equipamentoNome: exit.equipamento,
          requisicao: exit.requisicao,
          observacao: exit.observacao,
          movementType: exit.movementType,
          partnerName: exit.partnerName,
        });
        await reloadData();
        return;
      }

      setExits((current) => [{ ...exit, id: createId("sai"), status: "active" }, ...current]);
    },
    updateExit: async (id, exit) => {
      if (isRemoteMode && actor) {
        await updateSaidaApi(actor, id, {
          data: exit.data,
          combustivel: exit.combustivel,
          litros: exit.litros,
          usuarioNome: exit.usuarioNome,
          areaNome: exit.area,
          equipamentoNome: exit.equipamento,
          requisicao: exit.requisicao,
          observacao: exit.observacao,
          movementType: exit.movementType,
          partnerName: exit.partnerName,
        });
        await reloadData();
        return;
      }

      setExits((current) => current.map((item) => item.id === id ? { ...item, ...exit } : item));
    },
    cancelEntry: async (id, reason) => {
      if (isRemoteMode && actor) {
        await cancelEntradaApi(actor, id, reason);
        await reloadData();
        return;
      }

      setEntries((current) => current.map((item) => item.id === id ? { ...item, status: "cancelled", cancellationReason: reason, cancelledAt: new Date().toISOString() } : item));
    },
    cancelExit: async (id, reason) => {
      if (isRemoteMode && actor) {
        await cancelSaidaApi(actor, id, reason);
        await reloadData();
        return;
      }

      setExits((current) => current.map((item) => item.id === id ? { ...item, status: "cancelled", cancellationReason: reason, cancelledAt: new Date().toISOString() } : item));
    },
    reloadData,
  }), [entries, exits, stockByFuel, partnerBalances, totalStockLiters, totalExitLiters, totalEstimatedValue, totalLoanInLiters, totalLoanOutLiters, totalOwedLiters, isRemoteMode, isSyncing, syncError, actor]);

  return <FuelDataContext.Provider value={value}>{children}</FuelDataContext.Provider>;
}

export function useFuelData() {
  const context = useContext(FuelDataContext);
  if (!context) throw new Error("useFuelData must be used within FuelDataProvider");
  return context;
}

