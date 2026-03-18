import type { Request, Response } from "express";
import { dashboardFiltersSchema } from "../schemas/dashboard.schema.js";
import { getDashboardDataService } from "../services/dashboard.service.js";

export async function getDashboardDataController(request: Request, response: Response) {
  const filters = dashboardFiltersSchema.parse(request.query);
  const data = await getDashboardDataService(filters);
  return response.status(200).json(data);
}