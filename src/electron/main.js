import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { DatabaseManager } from "../backend/db";

import { importAllStations } from "../backend/scripts/station.script";
import { importAllStreamflow } from "../backend/scripts/streamflow.script";

import { StationService } from "../backend/services/station.service";
import { StationController } from "../backend/controllers/station.controller";
import { registerStationRoutes } from "../backend/routes/station.routes";

import { StreamflowService } from "../backend/services/streamflow.service";
import { StreamflowController } from "../backend/controllers/streamflow.controller";
import { registerStreamflowRoutes } from "../backend/routes/streamflow.routes";

import { PercentileService } from "../backend/services/calculations/percentile.service";
import { PercentileController } from "../backend/controllers/percentile.controller";
import { registerPercentileRoutes } from "../backend/routes/percentile.routes";

import { Q710Service } from "../backend/services/calculations/q710.service";
import { Q710Controller } from "../backend/controllers/q710.controller";
import { registerQ710Routes } from "../backend/routes/q710.routes";

if (started) {
    app.quit();
}

const dbManager = DatabaseManager.getInstance();

const getAssetPath = () => {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, "assets");
    } else {
        return path.join(app.getAppPath(), "src", "assets");
    }
}

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: path.join(getAssetPath(), "icon.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
        },
    });

    console.log("\n=== DEBUG DE CAMINHOS ===");
    console.log("__dirname:", __dirname);
    console.log("process.cwd():", process.cwd());

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
        console.log("🚀 Running in development mode with Vite");
        console.log("🔗 URL:", MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        const indexPath = path.join(__dirname, "../renderer/main_window/index.html");

        console.log("Loading production HTML from:", indexPath);
        mainWindow.loadFile(indexPath);
    }

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.webContents.openDevTools();
    }

    console.log("=========================\n");
};

const isDatabaseEmpty = (db) => {
    const stationCount = db.prepare("SELECT COUNT(*) as count FROM stations").get();
    const streamflowCount = db.prepare("SELECT COUNT(*) as count FROM daily_Streamflows").get();

    console.log(`Stations in database: ${stationCount.count}`);
    console.log(`Streamflow records in database: ${streamflowCount.count}`);

    return {
        hasStations: stationCount.count > 0,
        hasStreamflows: streamflowCount.count > 0,
        stationCount: stationCount.count,
        streamflowCount: streamflowCount.count,
    };
};

const importStationsIfNeeded = async (db, hasStations) => {
    if (hasStations) {
        console.log("Stations already imported, skipping...");
        return true;
    }

    console.log("\nDatabase is empty, importing stations...");
    const result = await importAllStations(db);

    if (result.success) {
        console.log(`Station import successful: ${result.imported} stations imported`);
        return true;
    } else {
        console.error(`Station import failed: ${result.error}`);
        return false;
    }
};

const importStreamflowsIfNeeded = async (db, hasStations, hasStreamflows) => {
    if (!hasStations) {
        console.log("\nSkipping streamflow import: No stations in database");
        return false;
    }

    if (hasStreamflows) {
        console.log("Streamflow data already imported, skipping...");
        return true;
    }

    console.log("\nNo streamflow data found, importing streamflow data...");
    const result = await importAllStreamflow(db);

    if (result.success) {
        console.log(`Streamflow import successful: ${result.imported} records imported`);
        return true;
    } else {
        console.error(`Streamflow import failed: ${result.error}`);
        return false;
    }
};

const setupStationModule = (db) => {
    const stationService = new StationService(db);
    const stationController = new StationController(stationService);
    registerStationRoutes(stationController);
    console.log("Station routes registered successfully");
};

const setupStreamflowModule = (db) => {
    const streamflowService = new StreamflowService(db);
    const streamflowController = new StreamflowController(streamflowService);
    registerStreamflowRoutes(streamflowController);
    console.log("Streamflow routes registered successfully");
};

const setupPercentileModule = (db) => {
    const percentileService = new PercentileService(db);
    const percentileController = new PercentileController(percentileService);
    registerPercentileRoutes(percentileController);
    console.log("Percentile  routes registered successfully");
};

const setupQ710Module = (db) => {
    const q710Service = new Q710Service(db);
    const q710Controller = new Q710Controller(q710Service);
    registerQ710Routes(q710Controller);
};

const initializeModules = (db) => {
    setupStationModule(db);
    setupStreamflowModule(db);
    setupPercentileModule(db);
    setupQ710Module(db);
    console.log("\nAll modules initialized successfully");
};

const populateDatabaseIfNeeded = async (db) => {
    const { hasStations, hasStreamflows } = isDatabaseEmpty(db);

    const stationsImported = await importStationsIfNeeded(db, hasStations);
    await importStreamflowsIfNeeded(db, stationsImported, hasStreamflows);
};

const initializeDatabase = async () => {
    const db = dbManager.initializeDatabase();
    console.log("Database initialized successfully\n");

    await populateDatabaseIfNeeded(db);
    initializeModules(db);

    return db;
};

const initializeApp = async () => {
    try {
        await initializeDatabase();
        createWindow();

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    } catch (error) {
        console.error("Application initialization failed:", error);
        throw error;
    }
};

app.whenReady()
    .then(initializeApp)
    .catch((err) => {
        console.error("Failed during app startup:", err);
    });

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        dbManager.closeDatabase();
        app.quit();
    }
});
