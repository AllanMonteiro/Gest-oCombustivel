import type { CreateInventoryEntryInput, CreateInventoryExitInput, CreateInventoryProductInput } from "../schemas/inventario.schema.js";
import type { ActorContext } from "../types/domain.js";
import { createInventoryEntryData, createInventoryExitData, createInventoryProductData, getInventoryStateData } from "../repositories/inventario.repository.js";

export async function getInventoryStateService() {
  return getInventoryStateData();
}

export async function createInventoryProductService(payload: CreateInventoryProductInput, actor: ActorContext) {
  return createInventoryProductData(payload, actor.id, actor.nome);
}

export async function createInventoryEntryService(payload: CreateInventoryEntryInput, actor: ActorContext) {
  return createInventoryEntryData(payload, actor.id, actor.nome);
}

export async function createInventoryExitService(payload: CreateInventoryExitInput, actor: ActorContext) {
  return createInventoryExitData(payload, actor.id, actor.nome);
}
