import { Router, type RequestHandler } from "express";
import { createEntradaController, updateEntradaController } from "../controllers/entradas.controller.js";
import { createInventoryEntryController, createInventoryExitController, createInventoryProductController, deleteInventoryEntryController, deleteInventoryExitController, getInventoryStateController } from "../controllers/inventario.controller.js";
import { createSaidaController, updateSaidaController } from "../controllers/saidas.controller.js";
import { getDashboardDataController } from "../controllers/dashboard.controller.js";
import { getOperationalStateController, cancelEntradaController, cancelSaidaController } from "../controllers/operacional.controller.js";
import { exportRelatorioMovimentacoesCsvController, getRelatorioMovimentacoesController } from "../controllers/relatorios.controller.js";
import { createAreaController, getAreasController } from "../controllers/areas.controller.js";
import { createEquipamentoController, getEquipamentosController } from "../controllers/equipamentos.controller.js";
import { createProfileController, getProfilesController } from "../controllers/profiles.controller.js";
import { createCombustivelController, getCombustiveisController } from "../controllers/combustiveis.controller.js";
import { getEmailConfigController, saveEmailConfigController, sendTestEmailController } from "../controllers/email-config.controller.js";

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
apiRouter.delete("/inventario/entradas/:id", wrap(deleteInventoryEntryController));
apiRouter.post("/inventario/saidas", wrap(createInventoryExitController));
apiRouter.delete("/inventario/saidas/:id", wrap(deleteInventoryExitController));
apiRouter.get("/dashboard", wrap(getDashboardDataController));
apiRouter.get("/relatorios/movimentacoes", wrap(getRelatorioMovimentacoesController));
apiRouter.get("/relatorios/movimentacoes.csv", wrap(exportRelatorioMovimentacoesCsvController));

apiRouter.get("/areas", wrap(getAreasController));
apiRouter.post("/areas", wrap(createAreaController));

apiRouter.get("/equipamentos", wrap(getEquipamentosController));
apiRouter.post("/equipamentos", wrap(createEquipamentoController));

apiRouter.get("/profiles", wrap(getProfilesController));
apiRouter.post("/profiles", wrap(createProfileController));

apiRouter.get("/combustiveis", wrap(getCombustiveisController));
apiRouter.post("/combustiveis", wrap(createCombustivelController));

// Email Summary routes (matching frontend legacy cloud function names for easier migration)
apiRouter.get("/email-summary/getFuelSummaryEmailSettingsHttp", wrap(getEmailConfigController));
apiRouter.post("/email-summary/saveFuelSummaryEmailSettingsHttp", wrap(saveEmailConfigController));
apiRouter.get("/email-summary/sendFuelSummaryEmailNow", wrap(sendTestEmailController));
