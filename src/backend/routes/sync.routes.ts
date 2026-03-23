import { ipcMain, BrowserWindow } from "electron";
import Database from "better-sqlite3";
import { DataSyncService } from "../services/data-sync.service";
import { SyncController } from "../controllers/sync.controller";

export const SyncChannels = {
    execute:  "sync:execute",
    cancel:   "sync:cancel",
    progress: "sync:progress",
} as const;

export function register(db: Database.Database, mainWindow: BrowserWindow): void {
    const service    = new DataSyncService(db);
    const controller = new SyncController(service);
    controller.setMainWindow(mainWindow);

    ipcMain.handle(SyncChannels.execute,
        async (_e, params: { cpf: string; senha: string; stationCode: string; startDate: string; endDate: string }) =>
            controller.handleSyncStation(params.cpf, params.senha, params.stationCode, params.startDate, params.endDate)
    );

    ipcMain.handle(SyncChannels.cancel, async () =>
        controller.handleCancelSync()
    );
}