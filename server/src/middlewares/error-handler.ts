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

  // Se for um erro do Supabase (PostgreSQL)
  const pgError = error as any;
  if (pgError.code === "23505") { // Unique violation
    const detail = String(pgError.detail || pgError.message || "");
    let userMessage = "Este registro já existe (conflito de chave única).";

    if (detail.includes("combustiveis_codigo_key")) {
      userMessage = "Já existe um combustível cadastrado com este código.";
    } else if (detail.includes("combustiveis_nome_key")) {
      userMessage = "Já existe um combustível cadastrado com este nome.";
    } else if (detail.includes("users_email_key")) {
      userMessage = "Este e-mail já está cadastrado.";
    } else if (detail.includes("areas_nome_key")) {
      userMessage = "Já existe uma área cadastrada com este nome.";
    } else if (detail.includes("equipamentos_nome_key")) {
      userMessage = "Já existe um equipamento cadastrado com este nome.";
    } else if (detail.includes("produtos_gerais_nome_key")) {
      userMessage = "Já existe um produto cadastrado com este nome.";
    }

    return response.status(409).json({
      message: userMessage,
      details: pgError.message || pgError.details,
    });
  }

  if (pgError.code && pgError.code.startsWith("23")) { // Outros erros de constraint
    return response.status(400).json({
      message: "Erro de integridade de dados.",
      details: pgError.message || pgError.details,
    });
  }

  const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor.";
  
  return response.status(500).json({ 
    message: errorMessage,
    error: process.env.NODE_ENV === "development" ? error : undefined
  });
}