import { Router, type RequestHandler } from "express";
import { createEntradaController, updateEntradaController } from "../controllers/entradas.controller.js";
import { createInventoryEntryController, createInventoryExitController, createInventoryProductController, getInventoryStateController } from "../controllers/inventario.controller.js";
import { createSaidaController, updateSaidaController } from "../controllers/saidas.controller.js";
import { getDashboardDataController } from "../controllers/dashboard.controller.js";
import { getOperationalStateController, cancelEntradaController, cancelSaidaController } from "../controllers/operacional.controller.js";
import { exportRelatorioMovimentacoesCsvController, getRelatorioMovimentacoesController } from "../controllers/relatorios.controller.js";

const wrap = (handler: RequestHandler): RequestHandler => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => response.status(200).json({ ok: true }));
apiRouter.get("/state", wrap(getOperationalStateController));
apiRouter.post("/entradas", wrap(createEntradaController));
apiRouter.patch("/entradas/:id", wrap(updateEntradaController));
apiRouter.patch("/entradas/:id/cancel", wrap(cancelEntradaController));
apiRouter.post("/saidas", wrap(createSaidaController));
apiRouter.patch("/saidas/:id", wrap(updateSaidaController));
apiRouter.patch("/saidas/:id/cancel", wrap(cancelSaidaController));
apiRouter.get("/inventario/state", wrap(getInventoryStateController));
apiRouter.post("/inventario/produtos", wrap(createInventoryProductController));
apiRouter.post("/inventario/entradas", wrap(createInventoryEntryController));
apiRouter.post("/inventario/saidas", wrap(createInventoryExitController));
apiRouter.get("/dashboard", wrap(getDashboardDataController));
apiRouter.get("/relatorios/movimentacoes", wrap(getRelatorioMovimentacoesController));
apiRouter.get("/relatorios/movimentacoes.csv", wrap(exportRelatorioMovimentacoesCsvController));
