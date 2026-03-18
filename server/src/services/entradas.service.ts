import type { CreateEntradaInput } from "../schemas/entrada.schema.js";
import type { ActorContext } from "../types/domain.js";
import { callCreateEntradaRpc, updateEntryData } from "../repositories/estoque.repository.js";

export async function createEntradaService(payload: CreateEntradaInput, actor: ActorContext) {
  return callCreateEntradaRpc(payload, actor.id, actor.nome);
}

export async function updateEntradaService(id: string, payload: CreateEntradaInput, actor: ActorContext) {
  return updateEntryData(id, payload, actor.id, actor.nome);
}