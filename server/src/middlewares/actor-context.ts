import type { NextFunction, Request, Response } from "express";
import type { ActorContext } from "../types/domain.js";
import { HttpError } from "../utils/http-error.js";

declare global {
  namespace Express {
    interface Request {
      actor?: ActorContext;
    }
  }
}

export function actorContextMiddleware(request: Request, _response: Response, next: NextFunction) {
  const id = request.header("x-user-id");
  const nome = request.header("x-user-name");
  const roleHeader = request.header("x-user-role");

  if (!id || !nome || !roleHeader) {
    return next(new HttpError(401, "Cabecalhos x-user-id, x-user-name e x-user-role sao obrigatorios nesta fase da migracao."));
  }

  if (roleHeader !== "admin" && roleHeader !== "operador" && roleHeader !== "gestor") {
    return next(new HttpError(403, "Perfil invalido."));
  }

  request.actor = { id, nome, role: roleHeader };
  return next();
}