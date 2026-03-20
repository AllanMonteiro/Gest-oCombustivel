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
  requisicao?: string;
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
    throw new Error(body.message || "Falha ao comunicar com a API operacional.");
  }

  if (response.headers.get("content-type")?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

export function fetchOperationalState(token: string) {
  return request<OperationalStateResponse>("/api/state", token, { method: "GET" });
}

export function createEntradaApi(token: string, payload: Record<string, unknown>) {
  return request("/api/entradas", token, { method: "POST", body: JSON.stringify(payload) });
}

export function updateEntradaApi(token: string, id: string, payload: Record<string, unknown>) {
  return request(`/api/entradas/${id}`, token, { method: "PATCH", body: JSON.stringify(payload) });
}

export function createSaidaApi(token: string, payload: Record<string, unknown>) {
  return request("/api/saidas", token, { method: "POST", body: JSON.stringify(payload) });
}

export function updateSaidaApi(token: string, id: string, payload: Record<string, unknown>) {
  return request(`/api/saidas/${id}`, token, { method: "PATCH", body: JSON.stringify(payload) });
}

export function cancelEntradaApi(token: string, id: string, reason: string) {
  return request(`/api/entradas/${id}/cancel`, token, { method: "PATCH", body: JSON.stringify({ reason }) });
}

export function cancelSaidaApi(token: string, id: string, reason: string) {
  return request(`/api/saidas/${id}/cancel`, token, { method: "PATCH", body: JSON.stringify({ reason }) });
}

