import { ipcMain, dialog, BrowserWindow } from "electron";
import fs from "fs/promises";
import path from "path";
import Database from "better-sqlite3";
import { ExportService, ExportFormat } from "../services/export.service";
import { ExportController } from "../controllers/export.controller";

export const ExportChannels = {
    exportStations: "export:stations",
} as const;

interface ExportParams {
    stationIds: string[];
    format: ExportFormat;
    startDate?: string;
    endDate?: string;
}

export function register(db: Database.Database, mainWindow: BrowserWindow): void {
    const service    = new ExportService(db);
    const controller = new ExportController(service);

    ipcMain.handle(ExportChannels.exportStations, async (_e, params: ExportParams) => {
        const result = await controller.handleExportStations(
            params.stationIds,
            params.format,
            params.startDate,
            params.endDate
        );

        if (!result.success || !result.data) {
            return { success: false, error: result.error };
        }

        const ext = params.format === "xlsx" ? "xlsx" : "csv";

        if (result.data.length === 1) {
            const [station] = result.data;

            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
                defaultPath: `${station.stationId}_vazoes.${ext}`,
                filters: [
                    params.format === "xlsx"
                        ? { name: "Excel", extensions: ["xlsx"] }
                        : { name: "CSV",   extensions: ["csv"]  },
                ],
            });

            if (canceled || !filePath) {
                return { success: false, error: "Export cancelled by user" };
            }

            await fs.writeFile(filePath, station.content);
            return { success: true, data: { savedPaths: [filePath] } };
        }

        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ["openDirectory"],
            title: "Selecione a pasta de destino",
        });

        if (canceled || !filePaths || filePaths.length === 0) {
            return { success: false, error: "Export cancelled by user" };
        }

        const targetDir = filePaths[0];
        const savedPaths: string[] = [];

        for (const station of result.data) {
            const filePath = path.join(targetDir, `${station.stationId}_vazoes.${ext}`);
            await fs.writeFile(filePath, station.content);
            savedPaths.push(filePath);
        }

        return { success: true, data: { savedPaths } };
    });
}