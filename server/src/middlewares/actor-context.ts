import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { ActorContext } from "../types/domain.js";
import { HttpError } from "../utils/http-error.js";
import { env } from "../config/env.js";

declare global {
  namespace Express {
    interface Request {
      actor?: ActorContext;
    }
  }
}

export function actorContextMiddleware(request: Request, _response: Response, next: NextFunction) {
  console.log(`[CORTEX] Requisicao ${request.method} em: ${request.path}`);
  if (request.method === "OPTIONS") {
    return next();
  }
  const authHeader = request.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError(401, "Token de autenticacao (Bearer) nao encontrado."));
  }

  const token = authHeader.replace("Bearer ", "");
  const secret = env.SUPABASE_JWT_SECRET?.trim() || "";

  if (!secret) {
    return next(new HttpError(500, "SUPABASE_JWT_SECRET nao configurado no servidor."));
  }

  try {
    let payload: any;
    try {
      // Supabase assina com os bytes decodificados do secret em base64
      const keyBuffer = Buffer.from(secret, "base64");
      payload = jwt.verify(token, keyBuffer, { algorithms: ["HS256"] });
    } catch {
      // Fallback: tenta com o secret como string literal (ambientes customizados)
      payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    }

    const { sub, email, user_metadata } = payload;
    const meta = user_metadata || {};

    const id = sub;
    const nome = meta.nome || (email ? email.split("@")[0] : "Usuario");
    const roleHeader = meta.role === "admin" || meta.role === "gestor" ? meta.role : "operador";

    if (!id) {
      return next(new HttpError(401, "Token JWT invalido (sem atributo sub)."));
    }

    request.actor = { id, nome, role: roleHeader };
    return next();
  } catch (error) {
    console.error("[CORTEX] Erro na validacao do JWT:", error instanceof Error ? error.message : error);
    return next(new HttpError(401, "Token JWT invalido ou expirado."));
  }
}