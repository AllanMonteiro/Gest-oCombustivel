import { Router } from "express";
import { createEntradaController, updateEntradaController } from "../controllers/entradas.controller.js";
import { createSaidaController, updateSaidaController } from "../controllers/saidas.controller.js";
import { getDashboardDataController } from "../controllers/dashboard.controller.js";
import { getOperationalStateController, cancelEntradaController, cancelSaidaController } from "../controllers/operacional.controller.js";
import { exportRelatorioMovimentacoesCsvController, getRelatorioMovimentacoesController } from "../controllers/relatorios.controller.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => response.status(200).json({ ok: true }));
apiRouter.get("/state", getOperationalStateController);
apiRouter.post("/entradas", createEntradaController);
apiRouter.patch("/entradas/:id", updateEntradaController);
apiRouter.patch("/entradas/:id/cancel", cancelEntradaController);
apiRouter.post("/saidas", createSaidaController);
apiRouter.patch("/saidas/:id", updateSaidaController);
apiRouter.patch("/saidas/:id/cancel", cancelSaidaController);
apiRouter.get("/dashboard", getDashboardDataController);
apiRouter.get("/relatorios/movimentacoes", getRelatorioMovimentacoesController);
apiRouter.get("/relatorios/movimentacoes.csv", exportRelatorioMovimentacoesCsvController);