import type { Request, Response } from "express";
import { createAreaData, getAreasData } from "../repositories/areas.repository.js";
import { HttpError } from "../utils/http-error.js";

export async function createAreaController(request: Request, response: Response) {
  const { nome, descricao, ativo } = request.body;

  if (!nome) {
    throw new HttpError(400, "O nome da area e obrigatorio.");
  }

  const area = await createAreaData({
    nome,
    descricao,
    ativo: typeof ativo === "boolean" ? ativo : ativo === "true",
  });

  return response.status(201).json(area);
}

export async function getAreasController(_request: Request, response: Response) {
  const areas = await getAreasData();
  return response.status(200).json(areas);
}
