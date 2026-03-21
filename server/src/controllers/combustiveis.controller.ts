import type { Request, Response } from "express";
import { createCombustivelData, getCombustiveisData } from "../repositories/combustiveis.repository.js";
import { HttpError } from "../utils/http-error.js";

export async function createCombustivelController(request: Request, response: Response) {
  const { nome, codigo, unidade, ativo } = request.body;

  if (!nome || !codigo) {
    throw new HttpError(400, "Nome e codigo do combustivel sao obrigatorios.");
  }

  const fuel = await createCombustivelData({
    nome,
    codigo,
    unidade: unidade || "L",
    ativo: typeof ativo === "boolean" ? ativo : ativo === "true",
  });

  return response.status(201).json(fuel);
}

export async function getCombustiveisController(_request: Request, response: Response) {
  const fuels = await getCombustiveisData();
  return response.status(200).json(fuels);
}
