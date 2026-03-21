import type { Request, Response } from "express";
import { createProfileData, getProfilesData } from "../repositories/profiles.repository.js";
import { HttpError } from "../utils/http-error.js";

export async function createProfileController(request: Request, response: Response) {
  const { nome, email, role, ativo } = request.body;

  if (!email || !nome || !role) {
    throw new HttpError(400, "Os campos email, nome e perfil sao obrigatorios.");
  }

  const profile = await createProfileData({
    nome,
    email,
    role,
    ativo: typeof ativo === "boolean" ? ativo : ativo === "true",
  });

  return response.status(201).json(profile);
}

export async function getProfilesController(_request: Request, response: Response) {
  const profiles = await getProfilesData();
  return response.status(200).json(profiles);
}
