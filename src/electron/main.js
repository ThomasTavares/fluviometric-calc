import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { DatabaseManager } from "../backend/db";
import { importAllStations } from "../backend/scripts/station.script";
import { StationService } from "../backend/services/station.service";
import { StationController } from "../backend/controllers/station.controller";
import { registerStationRoutes } from "../backend/routes/station.routes";

if (started) {
    app.quit();
}

const dbManager = DatabaseManager.getInstance();

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
        },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    mainWindow.webContents.openDevTools();
};

app.whenReady()
    .then(async () => {
        try {
            const db = dbManager.initializeDatabase();
            console.log("Database initialized successfully");

            const stationCount = db.prepare("SELECT COUNT(*) as count FROM stations").get();
            console.log(`Stations in database: ${stationCount.count}`);

            if (stationCount.count === 0) {
                console.log("\nDatabase is empty, importing stations...");
                const result = await importAllStations(db);

                if (result.success) {
                    console.log(`Auto-import successful: ${result.imported} stations imported`);
                } else {
                    console.error(`Auto-import failed: ${result.error}`);
                }
            }

            const stationService = new StationService(db);
            const stationController = new StationController(stationService);

            registerStationRoutes(stationController);
            console.log("Station routes registered successfully");
            
        } catch (error) {
            console.error("Database initialization failed:", error);
        }

        createWindow();

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    })
    .catch((err) => {
        console.error("Failed during app startup:", err);
    });

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        dbManager.closeDatabase();
        app.quit();
    }
});
