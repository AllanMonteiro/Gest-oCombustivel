import type { CreateInventoryEntryInput, CreateInventoryExitInput, CreateInventoryProductInput } from "../schemas/inventario.schema.js";
import type { ActorContext } from "../types/domain.js";
import { createInventoryEntryData, createInventoryExitData, createInventoryProductData, deleteInventoryEntryData, deleteInventoryExitData, getInventoryStateData } from "../repositories/inventario.repository.js";

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

export async function deleteInventoryEntryService(id: string, actor: ActorContext) {
  return deleteInventoryEntryData(id, actor.id, actor.nome);
}

export async function deleteInventoryExitService(id: string, actor: ActorContext) {
  return deleteInventoryExitData(id, actor.id, actor.nome);
}
