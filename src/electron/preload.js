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
        /**
         * Calcula percentil com método padrão (Weibull)
         * @param {string} stationId - ID da estação
         * @param {number} percentile - Percentil (0-100)
         * @param {object} dateRange - Opcional: {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
         */
        calculatePercentile: (stationId, percentile, dateRange) =>
            ipcRenderer.invoke("analysis:calculatePercentile", {
                stationId,
                percentile,
                dateRange,
            }),

        /**
         * Calcula percentil com método específico
         * @param {string} stationId - ID da estação
         * @param {number} percentile - Percentil (0-100)
         * @param {string} method - Método: 'weibull', 'cunnane', 'gringorten', etc.
         * @param {object} dateRange - Opcional: {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
         */
        calculatePercentileWithMethod: (stationId, percentile, method, dateRange) =>
            ipcRenderer.invoke("analysis:calculatePercentileWithMethod", {
                stationId,
                percentile,
                method,
                dateRange,
            }),

        /**
         * Compara TODOS os métodos disponíveis
         * Retorna: Weibull, Cunnane, Gringorten + métodos clássicos + Hyndman-Fan
         * @param {string} stationId - ID da estação
         * @param {number} percentile - Percentil (0-100)
         * @param {object} dateRange - Opcional: {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
         */
        compareAllPercentileMethods: (stationId, percentile, dateRange) =>
            ipcRenderer.invoke("analysis:compareAllPercentileMethods", {
                stationId,
                percentile,
                dateRange,
            }),

        /**
         * Compatibilidade: usa compareAllPercentileMethods
         * @deprecated Use compareAllPercentileMethods
         */
        comparePercentileMethods: (stationId, percentile, dateRange) =>
            ipcRenderer.invoke("analysis:comparePercentileMethods", {
                stationId,
                percentile,
                dateRange,
            }),

        /**
         * Calcula percentis padrão (Q95-Q50) usando Weibull
         * @param {string} stationId - ID da estação
         * @param {object} dateRange - Opcional: {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
         */
        calculateAllPercentiles: (stationId, dateRange) =>
            ipcRenderer.invoke("analysis:calculateAllPercentiles", {
                stationId,
                dateRange,
            }),

        /**
         * Calcula percentis personalizados usando Weibull
         * @param {string} stationId - ID da estação
         * @param {number[]} percentiles - Array de percentis
         * @param {object} dateRange - Opcional: {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
         */
        calculateCustomPercentiles: (stationId, percentiles, dateRange) =>
            ipcRenderer.invoke("analysis:calculateCustomPercentiles", {
                stationId,
                percentiles,
                dateRange,
            }),

        /**
         * Calcula percentis personalizados com método específico
         * @param {string} stationId - ID da estação
         * @param {number[]} percentiles - Array de percentis
         * @param {string} method - Método: 'weibull', 'cunnane', 'gringorten', etc.
         * @param {object} dateRange - Opcional: {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
         */
        calculateCustomPercentilesWithMethod: (stationId, percentiles, method, dateRange) =>
            ipcRenderer.invoke("analysis:calculateCustomPercentilesWithMethod", {
                stationId,
                percentiles,
                method,
                dateRange,
            }),

        /**
         * NOVO: Calcula a curva de permanência completa (Flow Duration Curve)
         * Para gerar o gráfico de vazões
         * @param {string} stationId - ID da estação
         * @param {object} dateRange - Opcional: {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
         * @param {number} numberOfPoints - Opcional: número de pontos para o gráfico (padrão: 100)
         */
        calculateFlowDurationCurve: (stationId, dateRange, numberOfPoints) =>
            ipcRenderer.invoke("analysis:calculateFlowDurationCurve", {
                stationId,
                dateRange,
                numberOfPoints,
            }),
        calculateQ710: (stationId, dateRange) =>
            ipcRenderer.invoke("analysis:calculateQ710", {
                stationId,
                dateRange,
            }),
    },

    getDatabaseStatus: async () => {
        return await ipcRenderer.invoke("database:status");
    },
    getDatabaseInfo: async () => {
        return await ipcRenderer.invoke("database:info");
    },
});
