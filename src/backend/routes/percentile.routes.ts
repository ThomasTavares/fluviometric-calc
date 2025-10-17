import { ipcMain } from "electron";
import { PercentileController } from "../controllers/percentile.controller";
import { PercentileMethod } from "../services/calculations/percentile.service";

interface DateRange {
    startDate?: string;
    endDate?: string;
}

export function registerPercentileRoutes(controller: PercentileController): void {

    ipcMain.handle(
        "analysis:calculatePercentile",
        async (
            event,
            params: { 
                stationId: string; 
                percentile: number;
                dateRange?: DateRange;
            }
        ) => {
            return await controller.handleCalculatePercentile(
                params.stationId,
                params.percentile,
                params.dateRange
            );
        }
    );

    ipcMain.handle(
        "analysis:calculatePercentileWithMethod",
        async (
            event,
            params: { 
                stationId: string; 
                percentile: number;
                method: PercentileMethod;
                dateRange?: DateRange;
            }
        ) => {
            return await controller.handleCalculatePercentileWithMethod(
                params.stationId,
                params.percentile,
                params.method,
                params.dateRange
            );
        }
    );

    ipcMain.handle(
        "analysis:compareAllPercentileMethods",
        async (
            event,
            params: { 
                stationId: string; 
                percentile: number;
                dateRange?: DateRange;
            }
        ) => {
            return await controller.handleCompareAllPercentileMethods(
                params.stationId,
                params.percentile,
                params.dateRange
            );
        }
    );

    ipcMain.handle(
        "analysis:comparePercentileMethods",
        async (
            event,
            params: { 
                stationId: string; 
                percentile: number;
                dateRange?: DateRange;
            }
        ) => {
            return await controller.handleComparePercentileMethods(
                params.stationId,
                params.percentile,
                params.dateRange
            );
        }
    );

    ipcMain.handle(
        "analysis:calculateAllPercentiles",
        async (
            event, 
            params: { 
                stationId: string;
                dateRange?: DateRange;
            }
        ) => {
            return await controller.handleCalculateAllPercentiles(
                params.stationId,
                params.dateRange
            );
        }
    );

    ipcMain.handle(
        "analysis:calculateCustomPercentiles",
        async (
            event,
            params: { 
                stationId: string; 
                percentiles: number[];
                dateRange?: DateRange;
            }
        ) => {
            return await controller.handleCalculateCustomPercentiles(
                params.stationId,
                params.percentiles,
                params.dateRange
            );
        }
    );

    ipcMain.handle(
        "analysis:calculateCustomPercentilesWithMethod",
        async (
            event,
            params: { 
                stationId: string; 
                percentiles: number[];
                method: PercentileMethod;
                dateRange?: DateRange;
            }
        ) => {
            return await controller.handleCalculateCustomPercentilesWithMethod(
                params.stationId,
                params.percentiles,
                params.method,
                params.dateRange
            );
        }
    );

    ipcMain.handle(
        "analysis:calculateFlowDurationCurve",
        async (
            event,
            params: { 
                stationId: string;
                dateRange?: DateRange;
                numberOfPoints?: number;
            }
        ) => {
            return await controller.handleCalculateFlowDurationCurve(
                params.stationId,
                params.dateRange,
                params.numberOfPoints
            );
        }
    );
}