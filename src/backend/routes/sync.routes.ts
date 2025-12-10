import { ipcMain, BrowserWindow } from "electron";
import { SyncController } from "../controllers/sync.controller";

export function registerSyncRoutes(controller: SyncController, mainWindow: BrowserWindow): void {
    controller.setMainWindow(mainWindow);

    ipcMain.handle(
        "sync:execute",
        async (
            _event,
            params: {
                cpf: string;
                senha: string;
                stationCode: string;
                startDate: string;
                endDate: string;
            }
        ) => {
            return await controller.handleSyncStation(
                params.cpf,
                params.senha,
                params.stationCode,
                params.startDate,
                params.endDate
            );
        }
    );

    ipcMain.handle("sync:cancel", async (_event) => {
        return controller.handleCancelSync();
    });
}
