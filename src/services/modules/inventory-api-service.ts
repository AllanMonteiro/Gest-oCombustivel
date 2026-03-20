import { env } from "@/lib/config/env";
import type { AppRole } from "@/contexts/auth/AuthContext";

export interface InventoryApiActor {
  id: string;
  nome: string;
  role: AppRole;
}

export interface RemoteInventoryProduct {
  id: string;
  nome: string;
  categoria: "Pecas" | "Movelaria" | "Material eletrico" | "Ferramentas" | "EPI" | "Outros";
  unidade: string;
  area_responsavel: string;
  estoque_minimo: number;
  descricao?: string;
  ativo: boolean;
  created_at: string;
}

export interface RemoteInventoryEntry {
  id: string;
  data: string;
  produto_id: string;
  quantidade: number;
  custo_unitario: number;
  fornecedor: string;
  nota_fiscal?: string;
  observacao?: string;
  created_at: string;
}

export interface RemoteInventoryExit {
  id: string;
  data: string;
  produto_id: string;
  quantidade: number;
  area: string;
  equipamento?: string;
  solicitante: string;
  aplicacao?: string;
  observacao?: string;
  created_at: string;
}

export interface RemoteInventoryStockItem {
  produto_id: string;
  produto_nome: string;
  categoria: "Pecas" | "Movelaria" | "Material eletrico" | "Ferramentas" | "EPI" | "Outros";
  unidade: string;
  area_responsavel: string;
  quantidade_entrada: number;
  quantidade_saida: number;
  saldo_atual: number;
  custo_medio: number;
  valor_estoque: number;
  estoque_minimo: number;
}

export interface InventoryStateResponse {
  products: RemoteInventoryProduct[];
  entries: RemoteInventoryEntry[];
  exits: RemoteInventoryExit[];
  stock: RemoteInventoryStockItem[];
}

function joinUrl(path: string) {
  return `${env.apiBaseUrl.replace(/\/$/, "")}${path}`;
}

function buildHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

async function request<T>(path: string, token: string, init?: RequestInit) {
  const response = await fetch(joinUrl(path), {
    ...init,
    headers: {
      ...buildHeaders(token),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Falha ao comunicar com a API de inventario.");
  }

  if (response.headers.get("content-type")?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

export function fetchInventoryState(token: string) {
  return request<InventoryStateResponse>("/api/inventario/state", token, { method: "GET" });
}

export function createInventoryProductApi(token: string, payload: Record<string, unknown>) {
  return request("/api/inventario/produtos", token, { method: "POST", body: JSON.stringify(payload) });
}

export function createInventoryEntryApi(token: string, payload: Record<string, unknown>) {
  return request("/api/inventario/entradas", token, { method: "POST", body: JSON.stringify(payload) });
}

export function createInventoryExitApi(token: string, payload: Record<string, unknown>) {
  return request("/api/inventario/saidas", token, { method: "POST", body: JSON.stringify(payload) });
}
