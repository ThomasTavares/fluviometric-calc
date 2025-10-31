import { ipcMain } from "electron";
import { PercentileController } from "../controllers/percentile.controller";
import { PercentileMethod } from "../services/calculations/percentile.service";

interface DateRange {
    startDate?: string;
    endDate?: string;
}

// NOVO: Interface para pré-processamento
interface PreprocessingConfig {
    mode?: "none" | "monthly" | "annually";
    maxFailurePercentage?: number;
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
                preprocessingConfig?: PreprocessingConfig; // NOVO
            }
        ) => {
            return await controller.handleCalculatePercentile(
                params.stationId,
                params.percentile,
                params.dateRange,
                params.preprocessingConfig // NOVO
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
                preprocessingConfig?: PreprocessingConfig; // NOVO
            }
        ) => {
            return await controller.handleCalculatePercentileWithMethod(
                params.stationId,
                params.percentile,
                params.method,
                params.dateRange,
                params.preprocessingConfig // NOVO
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
                preprocessingConfig?: PreprocessingConfig; // NOVO
            }
        ) => {
            return await controller.handleCalculateAllPercentiles(
                params.stationId,
                params.dateRange,
                params.preprocessingConfig // NOVO
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
                preprocessingConfig?: PreprocessingConfig; // NOVO
            }
        ) => {
            return await controller.handleCalculateCustomPercentiles(
                params.stationId,
                params.percentiles,
                params.dateRange,
                params.preprocessingConfig // NOVO
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
                preprocessingConfig?: PreprocessingConfig; // NOVO
            }
        ) => {
            return await controller.handleCalculateCustomPercentilesWithMethod(
                params.stationId,
                params.percentiles,
                params.method,
                params.dateRange,
                params.preprocessingConfig // NOVO
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
                preprocessingConfig?: PreprocessingConfig; // NOVO
            }
        ) => {
            return await controller.handleCalculateFlowDurationCurve(
                params.stationId,
                params.dateRange,
                params.numberOfPoints,
                params.preprocessingConfig // NOVO
            );
        }
    );
}
