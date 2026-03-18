import type { Request, Response } from "express";
import { cancelMovementSchema } from "../schemas/saida.schema.js";
import { cancelEntradaService, cancelSaidaService, getOperationalStateService } from "../services/operacional.service.js";

export async function getOperationalStateController(_request: Request, response: Response) {
  const data = await getOperationalStateService();
  return response.status(200).json(data);
}

export async function cancelEntradaController(request: Request, response: Response) {
  const payload = cancelMovementSchema.parse(request.body);
  const id = String(request.params.id ?? "");
  const data = await cancelEntradaService(id, payload.reason, request.actor!);
  return response.status(200).json(data);
}

export async function cancelSaidaController(request: Request, response: Response) {
  const payload = cancelMovementSchema.parse(request.body);
  const id = String(request.params.id ?? "");
  const data = await cancelSaidaService(id, payload.reason, request.actor!);
  return response.status(200).json(data);
}