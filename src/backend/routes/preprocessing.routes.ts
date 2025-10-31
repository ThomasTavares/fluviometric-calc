import { ipcMain } from "electron";
import { PreprocessingController } from "../controllers/preprocessing.controller";
import Database from "better-sqlite3";

export function registerPreprocessingRoutes(controller: PreprocessingController) { // ✅ Recebe controller
    ipcMain.handle("preprocessing:analyze", async (_, params) => {
        return controller.analyze(params);
    });
}
