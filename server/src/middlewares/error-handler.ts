import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error.js";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  console.error("[CORTEX] Erro capturado pelo handler:", error);

  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Falha de validacao.",
      issues: error.issues,
    });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  // Se for um erro do Supabase ou outro erro inesperado
  const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor.";
  
  return response.status(500).json({ 
    message: errorMessage,
    error: process.env.NODE_ENV === "development" ? error : undefined
  });
}