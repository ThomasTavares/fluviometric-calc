// src/electron/preload.js
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('backendApi', {
  getAllStations: async () => {
    return await ipcRenderer.invoke('stations:getAll');
  },
  saveStationJson: async (stationPayload) => {
    return await ipcRenderer.invoke('stations:save', stationPayload);
  }
});
