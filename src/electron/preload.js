// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("backendApi", {
    stations: {
        getAll: () => ipcRenderer.invoke("stations:getAll"),
        getById: (id) => ipcRenderer.invoke("stations:getById", id),
        search: (filters) => ipcRenderer.invoke("stations:search", filters),
        count: () => ipcRenderer.invoke("stations:count"),
        import: () => ipcRenderer.invoke("stations:import"),
    },

    streamflow: {
        getForExport: (stationId, startDate, endDate) =>
            ipcRenderer.invoke("streamflow:getForExport", stationId, startDate, endDate),
        analyzeNullFlows: (stationId, startDate, endDate) =>
            ipcRenderer.invoke("streamflow:analyzeNullFlows", stationId, startDate, endDate),
        getNullFlowsSummary: (stationId, startDate, endDate) =>
            ipcRenderer.invoke("streamflow:getNullFlowsSummary", stationId, startDate, endDate),
    },

    analysis: {
        calculatePercentileWithMethod: (stationId, percentile, method, dateRange, preprocessingOptions) =>
            ipcRenderer.invoke("analysis:calculatePercentileWithMethod", {
                stationId,
                percentile,
                method,
                dateRange,
                preprocessingOptions, // NOVO
            }),

        calculateAllPercentiles: (stationId, dateRange, preprocessingOptions) =>
            ipcRenderer.invoke("analysis:calculateAllPercentiles", {
                stationId,
                dateRange,
                preprocessingOptions, // NOVO
            }),

        calculateFlowDurationCurve: (stationId, dateRange, numberOfPoints, preprocessingOptions) =>
            ipcRenderer.invoke("analysis:calculateFlowDurationCurve", {
                stationId,
                dateRange,
                numberOfPoints,
                preprocessingOptions, // NOVO
            }),

        calculateQ710: (stationId, dateRange, preprocessingOptions) =>
            ipcRenderer.invoke("analysis:calculateQ710", {
                stationId,
                dateRange,
                preprocessingOptions, // NOVO
            }),
    },

    // NOVO: API de Preprocessing
    preprocessing: {
        analyze: (params) => ipcRenderer.invoke("preprocessing:analyze", params),
    },

    getDatabaseStatus: async () => {
        return await ipcRenderer.invoke("database:status");
    },
    getDatabaseInfo: async () => {
        return await ipcRenderer.invoke("database:info");
    },
});
