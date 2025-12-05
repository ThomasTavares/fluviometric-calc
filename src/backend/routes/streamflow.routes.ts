import { ipcMain } from "electron";
import { StreamflowController } from "../controllers/streamflow.controller";

export function registerStreamflowRoutes(controller: StreamflowController): void {
    ipcMain.handle(
        "streamflow:getForExport",
        async (_event, stationId: string, startDate?: string, endDate?: string) => {
            return await controller.handleGetStreamflowsForExport(stationId, startDate, endDate);
        }
    );

    ipcMain.handle(
        "streamflow:analyzeNullFlows",
        async (_, stationId: string, startDate?: string, endDate?: string) => {
            try {
                return controller.analyzeNullFlows(stationId, startDate, endDate);
            } catch (error) {
                console.error("Error in streamflow:analyzeNullFlows:", error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error occurred",
                };
            }
        }
    );

    ipcMain.handle(
        "streamflow:getNullFlowsSummary",
        async (_, stationId: string, startDate?: string, endDate?: string) => {
            try {
                return controller.getNullFlowsSummary(stationId, startDate, endDate);
            } catch (error) {
                console.error("Error in streamflow:getNullFlowsSummary:", error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error occurred",
                };
            }
        }
    );
    
    ipcMain.handle("streamflow:getAvailableDateRange", async (_, stationId: string) => {
        return controller.getAvailableDateRange(stationId);
    });
}
