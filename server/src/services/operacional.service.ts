import { cancelEntryData, cancelExitData, getOperationalStateData } from "../repositories/estoque.repository.js";
import type { ActorContext } from "../types/domain.js";

export async function getOperationalStateService() {
  return getOperationalStateData();
}

export async function cancelEntradaService(id: string, reason: string, actor: ActorContext) {
  return cancelEntryData(id, reason, actor.id, actor.nome);
}

export async function cancelSaidaService(id: string, reason: string, actor: ActorContext) {
  return cancelExitData(id, reason, actor.id, actor.nome);
}