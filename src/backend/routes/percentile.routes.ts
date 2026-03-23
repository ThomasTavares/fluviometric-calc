import { ipcMain } from "electron";
import Database from "better-sqlite3";
import { PercentileService, PercentileMethod } from "../services/calculations/percentile.service";
import { PercentileController } from "../controllers/percentile.controller";

interface DateRange {
    startDate?: string;
    endDate?: string;
}

export const PercentileChannels = {
    calculatePercentile:                "analysis:calculatePercentile",
    calculatePercentileWithMethod:      "analysis:calculatePercentileWithMethod",
    compareAllPercentileMethods:        "analysis:compareAllPercentileMethods",
    comparePercentileMethods:           "analysis:comparePercentileMethods",
    calculateAllPercentiles:            "analysis:calculateAllPercentiles",
    calculateCustomPercentiles:         "analysis:calculateCustomPercentiles",
    calculateCustomPercentilesWithMethod: "analysis:calculateCustomPercentilesWithMethod",
    calculateFlowDurationCurve:         "analysis:calculateFlowDurationCurve",
} as const;

export function register(db: Database.Database): void {
    const service    = new PercentileService(db);
    const controller = new PercentileController(service);

    ipcMain.handle(PercentileChannels.calculatePercentile,
        async (_e, params: { stationId: string; percentile: number; dateRange?: DateRange }) =>
            controller.handleCalculatePercentile(params.stationId, params.percentile, params.dateRange)
    );

    ipcMain.handle(PercentileChannels.calculatePercentileWithMethod,
        async (_e, params: { stationId: string; percentile: number; method: PercentileMethod; dateRange?: DateRange }) =>
            controller.handleCalculatePercentileWithMethod(params.stationId, params.percentile, params.method, params.dateRange)
    );

    ipcMain.handle(PercentileChannels.compareAllPercentileMethods,
        async (_e, params: { stationId: string; percentile: number; dateRange?: DateRange }) =>
            controller.handleCompareAllPercentileMethods(params.stationId, params.percentile, params.dateRange)
    );

    ipcMain.handle(PercentileChannels.comparePercentileMethods,
        async (_e, params: { stationId: string; percentile: number; dateRange?: DateRange }) =>
            controller.handleComparePercentileMethods(params.stationId, params.percentile, params.dateRange)
    );

    ipcMain.handle(PercentileChannels.calculateAllPercentiles,
        async (_e, params: { stationId: string; dateRange?: DateRange }) =>
            controller.handleCalculateAllPercentiles(params.stationId, params.dateRange)
    );

    ipcMain.handle(PercentileChannels.calculateCustomPercentiles,
        async (_e, params: { stationId: string; percentiles: number[]; dateRange?: DateRange }) =>
            controller.handleCalculateCustomPercentiles(params.stationId, params.percentiles, params.dateRange)
    );

    ipcMain.handle(PercentileChannels.calculateCustomPercentilesWithMethod,
        async (_e, params: { stationId: string; percentiles: number[]; method: PercentileMethod; dateRange?: DateRange }) =>
            controller.handleCalculateCustomPercentilesWithMethod(params.stationId, params.percentiles, params.method, params.dateRange)
    );

    ipcMain.handle(PercentileChannels.calculateFlowDurationCurve,
        async (_e, params: { stationId: string; dateRange?: DateRange; numberOfPoints?: number }) =>
            controller.handleCalculateFlowDurationCurve(params.stationId, params.dateRange, params.numberOfPoints)
    );
}