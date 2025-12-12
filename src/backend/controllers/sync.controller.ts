import { DataSyncService, SyncProgress } from "../services/data-sync.service";
import { BrowserWindow } from "electron";

export class SyncController {
    private syncService: DataSyncService;
    private mainWindow: BrowserWindow | null = null;

    constructor(syncService: DataSyncService) {
        this.syncService = syncService;
    }

    setMainWindow(window: BrowserWindow): void {
        this.mainWindow = window;
    }

    async handleSyncStation(
        cpf: string,
        password: string,
        stationCode: string,
        startDate: string,
        endDate: string
    ) {
        if (!cpf || !password || !stationCode || !startDate || !endDate) {
            return {
                success: false,
                error: "Todos os campos são obrigatórios",
            };
        }

        try {
            const result = await this.syncService.syncStation(
                cpf,
                password,
                stationCode,
                startDate,
                endDate,
                (progress: SyncProgress) => {
                    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                        this.mainWindow.webContents.send("sync:progress", progress);
                    }
                }
            );

            return result;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro desconhecido durante sincronização",
            };
        }
    }

    handleCancelSync() {
        try {
            this.syncService.cancel();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erro ao cancelar sincronização",
            };
        }
    }
}
