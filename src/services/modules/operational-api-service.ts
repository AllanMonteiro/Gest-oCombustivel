import { env } from "@/lib/config/env";
import type { AppRole } from "@/contexts/auth/AuthContext";

export interface ApiActor {
  id: string;
  nome: string;
  role: AppRole;
}

export interface RemoteEntryRecord {
  id: string;
  data: string;
  fornecedor: string;
  combustivel_nome: string;
  litros: number;
  valor_litro: number;
  nota_fiscal?: string;
  observacao?: string;
  movement_type: "regular" | "loan_in" | "return_in";
  partner_name?: string;
  status: "active" | "cancelled";
  cancellation_reason?: string;
}

export interface RemoteExitRecord {
  id: string;
  data: string;
  combustivel_nome: string;
  litros: number;
  usuario_nome?: string;
  area_nome?: string;
  equipamento_nome?: string;
  observacao?: string;
  movement_type: "regular" | "loan_out" | "return_out";
  partner_name?: string;
  status: "active" | "cancelled";
  cancellation_reason?: string;
}

export interface OperationalStateResponse {
  stock: Array<{
    combustivel_nome: string;
    total_litros: number;
    custo_medio: number;
    valor_total_estoque: number;
  }>;
  entries: RemoteEntryRecord[];
  exits: RemoteExitRecord[];
}

function joinUrl(path: string) {
  return `${env.apiBaseUrl.replace(/\/$/, "")}${path}`;
}

function buildHeaders(actor: ApiActor) {
  return {
    "Content-Type": "application/json",
    "x-user-id": actor.id,
    "x-user-name": actor.nome,
    "x-user-role": actor.role,
  };
}

async function request<T>(path: string, actor: ApiActor, init?: RequestInit) {
  const response = await fetch(joinUrl(path), {
    ...init,
    headers: {
      ...buildHeaders(actor),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Falha ao comunicar com a API operacional.");
  }

  if (response.headers.get("content-type")?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

export function fetchOperationalState(actor: ApiActor) {
  return request<OperationalStateResponse>("/api/state", actor, { method: "GET" });
}

export function createEntradaApi(actor: ApiActor, payload: Record<string, unknown>) {
  return request("/api/entradas", actor, { method: "POST", body: JSON.stringify(payload) });
}

export function updateEntradaApi(actor: ApiActor, id: string, payload: Record<string, unknown>) {
  return request(`/api/entradas/${id}`, actor, { method: "PATCH", body: JSON.stringify(payload) });
}

export function createSaidaApi(actor: ApiActor, payload: Record<string, unknown>) {
  return request("/api/saidas", actor, { method: "POST", body: JSON.stringify(payload) });
}

export function updateSaidaApi(actor: ApiActor, id: string, payload: Record<string, unknown>) {
  return request(`/api/saidas/${id}`, actor, { method: "PATCH", body: JSON.stringify(payload) });
}

export function cancelEntradaApi(actor: ApiActor, id: string, reason: string) {
  return request(`/api/entradas/${id}/cancel`, actor, { method: "PATCH", body: JSON.stringify({ reason }) });
}

export function cancelSaidaApi(actor: ApiActor, id: string, reason: string) {
  return request(`/api/saidas/${id}/cancel`, actor, { method: "PATCH", body: JSON.stringify({ reason }) });
}