import { ipcMain } from "electron";
import Database from "better-sqlite3";
import { StreamflowService } from "../services/streamflow.service";
import { StreamflowController } from "../controllers/streamflow.controller";

export const StreamflowChannels = {
    getForExport:        "streamflow:getForExport",
    analyzeNullFlows:    "streamflow:analyzeNullFlows",
    getNullFlowsSummary: "streamflow:getNullFlowsSummary",
    getAvailableDateRange: "streamflow:getAvailableDateRange",
} as const;

export function register(db: Database.Database): void {
    const service    = new StreamflowService(db);
    const controller = new StreamflowController(service);

    ipcMain.handle(StreamflowChannels.getForExport, async (_e, stationId: string, startDate?: string, endDate?: string) =>
        controller.handleGetStreamflowsForExport(stationId, startDate, endDate)
    );

    ipcMain.handle(StreamflowChannels.analyzeNullFlows, async (_e, stationId: string, startDate?: string, endDate?: string) => {
        try {
            return controller.analyzeNullFlows(stationId, startDate, endDate);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    });

    ipcMain.handle(StreamflowChannels.getNullFlowsSummary, async (_e, stationId: string, startDate?: string, endDate?: string) => {
        try {
            return controller.getNullFlowsSummary(stationId, startDate, endDate);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    });

    ipcMain.handle(StreamflowChannels.getAvailableDateRange, async (_e, stationId: string) =>
        controller.getAvailableDateRange(stationId)
    );
}