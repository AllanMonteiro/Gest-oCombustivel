import type { CreateSaidaInput } from "../schemas/saida.schema.js";
import type { ActorContext } from "../types/domain.js";
import { callCreateSaidaRpc, updateExitData } from "../repositories/estoque.repository.js";

export async function createSaidaService(payload: CreateSaidaInput, actor: ActorContext) {
  return callCreateSaidaRpc(payload, actor.id, actor.nome);
}

export async function updateSaidaService(id: string, payload: CreateSaidaInput, actor: ActorContext) {
  return updateExitData(id, payload, actor.id, actor.nome);
}