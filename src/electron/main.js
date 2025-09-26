// src/electron/main.js
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { initDatabase, getAllStations, saveStationJson } from "../backend/repositories/repository.ts";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  // Inicializa o banco
  initDatabase();

  // Handler para obter todas as estações
  ipcMain.handle('stations:getAll', async () => {
    try {
      const stationRecords = getAllStations();
      return { success: true, payload: stationRecords };
    } catch (error) {
      console.error("Error fetching stations:", error);
      return { success: false, error: String(error) };
    }
  });

  // Handler para salvar uma estação (recebe o JSON do renderer)
  ipcMain.handle('stations:save', async (event, stationPayload) => {
    try {
      // Validação leve no main (repository fará validação mais estrita)
      if (!stationPayload || typeof stationPayload.codigo_estacao !== "string") {
        return { success: false, error: "Payload inválido. Deve conter codigo_estacao (string) e items (array)." };
      }
      const result = saveStationJson(stationPayload);
      return { success: true, message: result.message ?? "Saved" };
    } catch (error) {
      console.error("Error saving station:", error);
      return { success: false, error: String(error) };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
})
.catch(err => {
  console.error("Failed during app startup:", err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
