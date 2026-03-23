import { contextBridge, ipcRenderer } from "electron";
import { StationChannels } from "../backend/routes/station.routes";

const api = {
    stations: {
        getAll:  ()            => ipcRenderer.invoke(StationChannels.getAll),
        getById: (id: string)  => ipcRenderer.invoke(StationChannels.getById, id),
        update:  (stationData: {
            id: string;
            name?: string;
            type?: string;
            additional_code?: string;
            basin_code?: string;
            sub_basin_code?: string;
            river_name?: string;
            state_name?: string;
            city_name?: string;
            responsible_sigla?: string;
            operator_sigla?: string;
            drainage_area?: number;
            latitude?: number;
            longitude?: number;
            altitude?: number;
        }) => ipcRenderer.invoke(StationChannels.update, stationData),
        search: (filters: {
            name?: string;
            basin_code?: string;
            sub_basin_code?: string;
            river_name?: string;
            state_name?: string;
            city_name?: string;
        }) => ipcRenderer.invoke(StationChannels.search, filters),
        count:  () => ipcRenderer.invoke(StationChannels.count),
        import: () => ipcRenderer.invoke("stations:import"),
    },

    streamflow: {
        getForExport: (stationId: string, startDate?: string, endDate?: string) =>
            ipcRenderer.invoke("streamflow:getForExport", stationId, startDate, endDate),
        analyzeNullFlows: (stationId: string, startDate?: string, endDate?: string) =>
            ipcRenderer.invoke("streamflow:analyzeNullFlows", stationId, startDate, endDate),
        getNullFlowsSummary: (stationId: string, startDate?: string, endDate?: string) =>
            ipcRenderer.invoke("streamflow:getNullFlowsSummary", stationId, startDate, endDate),
        getAvailableDateRange: (stationId: string) =>
            ipcRenderer.invoke("streamflow:getAvailableDateRange", stationId),
    },

    analysis: {
        calculatePercentile: (stationId: string, percentile: number, dateRange?: { startDate: string; endDate: string }) =>
            ipcRenderer.invoke("analysis:calculatePercentile", { stationId, percentile, dateRange }),
        calculatePercentileWithMethod: (stationId: string, percentile: number, method: string, dateRange?: { startDate: string; endDate: string }) =>
            ipcRenderer.invoke("analysis:calculatePercentileWithMethod", { stationId, percentile, method, dateRange }),
        compareAllPercentileMethods: (stationId: string, percentile: number, dateRange?: { startDate: string; endDate: string }) =>
            ipcRenderer.invoke("analysis:compareAllPercentileMethods", { stationId, percentile, dateRange }),
        comparePercentileMethods: (stationId: string, percentile: number, dateRange?: { startDate: string; endDate: string }) =>
            ipcRenderer.invoke("analysis:comparePercentileMethods", { stationId, percentile, dateRange }),
        calculateAllPercentiles: (stationId: string, dateRange?: { startDate: string; endDate: string }) =>
            ipcRenderer.invoke("analysis:calculateAllPercentiles", { stationId, dateRange }),
        calculateCustomPercentiles: (stationId: string, percentiles: number[], dateRange?: { startDate: string; endDate: string }) =>
            ipcRenderer.invoke("analysis:calculateCustomPercentiles", { stationId, percentiles, dateRange }),
        calculateCustomPercentilesWithMethod: (stationId: string, percentiles: number[], method: string, dateRange?: { startDate: string; endDate: string }) =>
            ipcRenderer.invoke("analysis:calculateCustomPercentilesWithMethod", { stationId, percentiles, method, dateRange }),
        calculateFlowDurationCurve: (stationId: string, dateRange?: { startDate: string; endDate: string }, numberOfPoints?: number) =>
            ipcRenderer.invoke("analysis:calculateFlowDurationCurve", { stationId, dateRange, numberOfPoints }),
        calculateQ710: (stationId: string, dateRange?: { startDate: string; endDate: string }) =>
            ipcRenderer.invoke("analysis:calculateQ710", { stationId, dateRange }),
    },

    getDatabaseStatus: () => ipcRenderer.invoke("database:status"),
    getDatabaseInfo:   () => ipcRenderer.invoke("database:info"),

    sync: {
        execute: (params: {
            cpf: string;
            senha: string;
            stationCode: string;
            startDate: string;
            endDate: string;
        }) => ipcRenderer.invoke("sync:execute", params),
        cancel: () => ipcRenderer.invoke("sync:cancel"),
        onProgress: (callback: (progress: {
            windowsCompleted: number;
            totalWindows: number;
            currentWindow: string;
            recordsInserted: number;
            recordsUpdated: number;
        }) => void) => {
            ipcRenderer.on("sync:progress", (_event, progress) => callback(progress));
        },
        removeProgressListener: () => {
            ipcRenderer.removeAllListeners("sync:progress");
        },
    },
    exportStations: (params: {
        stationIds: string[];
        format: "csv" | "xlsx";
        startDate?: string;
        endDate?: string;
    }) => ipcRenderer.invoke("export:stations", params),
};

contextBridge.exposeInMainWorld("backendApi", api);

export type BackendAPI = typeof api;
