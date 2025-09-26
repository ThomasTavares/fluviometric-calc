// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('backendApi', {
  getAllStations: async () => {
    return await ipcRenderer.invoke('stations:getAll');
  },
  saveStationJson: async (stationPayload) => {
    return await ipcRenderer.invoke('stations:save', stationPayload);
  }
});