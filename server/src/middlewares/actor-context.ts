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
  const authHeader = request.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError(401, "Token de autenticacao (Bearer) nao encontrado."));
  }

  const token = authHeader.replace("Bearer ", "");
  const secret = env.SUPABASE_JWT_SECRET;
  
  if (!secret) {
    return next(new HttpError(500, "SUPABASE_JWT_SECRET nao configurado no servidor."));
  }

  try {
    const payload = jwt.verify(token, secret) as any;
    
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
    return next(new HttpError(401, "Token JWT invalido ou expirado."));
  }
}