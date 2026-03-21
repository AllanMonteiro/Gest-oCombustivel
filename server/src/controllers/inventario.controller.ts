import type { Request, Response } from "express";
import { createInventoryEntrySchema, createInventoryExitSchema, createInventoryProductSchema } from "../schemas/inventario.schema.js";
import { createInventoryEntryService, createInventoryExitService, createInventoryProductService, deleteInventoryEntryService, deleteInventoryExitService, getInventoryStateService } from "../services/inventario.service.js";

export async function getInventoryStateController(_request: Request, response: Response) {
  const data = await getInventoryStateService();
  return response.status(200).json(data);
}

export async function createInventoryProductController(request: Request, response: Response) {
  const payload = createInventoryProductSchema.parse(request.body);
  const data = await createInventoryProductService(payload, request.actor!);
  return response.status(201).json(data);
}

export async function createInventoryEntryController(request: Request, response: Response) {
  const payload = createInventoryEntrySchema.parse(request.body);
  const data = await createInventoryEntryService(payload, request.actor!);
  return response.status(201).json(data);
}

export async function createInventoryExitController(request: Request, response: Response) {
  const payload = createInventoryExitSchema.parse(request.body);
  const data = await createInventoryExitService(payload, request.actor!);
  return response.status(201).json(data);
}

export async function deleteInventoryEntryController(request: Request, response: Response) {
  const { id } = request.params;
  await deleteInventoryEntryService(id as string, request.actor!);
  return response.status(204).end();
}

export async function deleteInventoryExitController(request: Request, response: Response) {
  const { id } = request.params;
  await deleteInventoryExitService(id as string, request.actor!);
  return response.status(204).end();
}

