import type { Request, Response } from "express";
import { createSaidaSchema } from "../schemas/saida.schema.js";
import { createSaidaService, updateSaidaService } from "../services/saidas.service.js";

export async function createSaidaController(request: Request, response: Response) {
  const payload = createSaidaSchema.parse(request.body);
  const data = await createSaidaService(payload, request.actor!);
  return response.status(201).json(data);
}

export async function updateSaidaController(request: Request, response: Response) {
  const payload = createSaidaSchema.parse(request.body);
  const id = String(request.params.id ?? "");
  const data = await updateSaidaService(id, payload, request.actor!);
  return response.status(200).json(data);
}