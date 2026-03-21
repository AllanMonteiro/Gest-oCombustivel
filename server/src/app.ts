import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { actorContextMiddleware } from "./middlewares/actor-context.js";
import { apiRouter } from "./routes/index.js";

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-name", "x-user-role"],
};

export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(express.json());
  app.get("/api/health", (_request, response) => response.status(200).json({ ok: true, appUrl: env.APP_URL }));
  app.use("/api", actorContextMiddleware, apiRouter);
  app.use(errorHandler);

  return app;
}