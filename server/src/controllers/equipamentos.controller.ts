import type { Request, Response } from "express";
import { createEquipamentoData, getEquipamentosData } from "../repositories/equipamentos.repository.js";
import { HttpError } from "../utils/http-error.js";

export async function createEquipamentoController(request: Request, response: Response) {
  const { nome, tipo, areaPadrao, ativo } = request.body;

  if (!nome || !tipo) {
    throw new HttpError(400, "Nome e tipo do equipamento sao obrigatorios.");
  }

  const equip = await createEquipamentoData({
    nome,
    tipo,
    area_padrao: areaPadrao,
    ativo: typeof ativo === "boolean" ? ativo : ativo === "true",
  });

  return response.status(201).json(equip);
}

export async function getEquipamentosController(_request: Request, response: Response) {
  const equips = await getEquipamentosData();
  return response.status(200).json(equips);
}
