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
                password: string;
                stationCode: string;
                startDate: string;
                endDate: string;
            }
        ) => {
            return await controller.handleSyncStation(
                params.cpf,
                params.password,
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
