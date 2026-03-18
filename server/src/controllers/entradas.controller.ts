import type { Request, Response } from "express";
import { createEntradaSchema } from "../schemas/entrada.schema.js";
import { createEntradaService, updateEntradaService } from "../services/entradas.service.js";

export async function createEntradaController(request: Request, response: Response) {
  const payload = createEntradaSchema.parse(request.body);
  const data = await createEntradaService(payload, request.actor!);
  return response.status(201).json(data);
}

export async function updateEntradaController(request: Request, response: Response) {
  const payload = createEntradaSchema.parse(request.body);
  const id = String(request.params.id ?? "");
  const data = await updateEntradaService(id, payload, request.actor!);
  return response.status(200).json(data);
}