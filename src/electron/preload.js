// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("backendApi", {
    stations: {
        getAll: () => ipcRenderer.invoke("stations:getAll"),
        getById: (id) => ipcRenderer.invoke("stations:getById", id),
        search: (filters) => ipcRenderer.invoke("stations:search", filters),
        count: () => ipcRenderer.invoke("stations:count"),
        import: () => ipcRenderer.invoke("stations:import"),
    },

    getDatabaseStatus: async () => {
        return await ipcRenderer.invoke("database:status");
    },
    getDatabaseInfo: async () => {
        return await ipcRenderer.invoke("database:info");
    },
});
