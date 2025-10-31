import { PercentileService, PercentileMethod } from "../services/calculations/percentile.service";

interface DateRange {
    startDate?: string;
    endDate?: string;
}

// NOVO: Interface para pré-processamento
interface PreprocessingConfig {
    mode?: "none" | "monthly" | "annually";
    maxFailurePercentage?: number;
}

export class PercentileController {
    private percentileService: PercentileService;

    constructor(percentileService: PercentileService) {
        this.percentileService = percentileService;
    }

    async handleCalculatePercentile(
        stationId: string,
        percentile: number,
        dateRange?: DateRange,
        preprocessingConfig?: PreprocessingConfig // NOVO
    ) {
        return this.percentileService.calculatePercentile(
            stationId,
            percentile,
            dateRange,
            preprocessingConfig // NOVO
        );
    }

    async handleCalculatePercentileWithMethod(
        stationId: string,
        percentile: number,
        method: PercentileMethod,
        dateRange?: DateRange,
        preprocessingConfig?: PreprocessingConfig // NOVO
    ) {
        return this.percentileService.calculatePercentileWithMethod(
            stationId,
            percentile,
            method,
            dateRange,
            preprocessingConfig // NOVO
        );
    }

    async handleCalculateAllPercentiles(
        stationId: string,
        dateRange?: DateRange,
        preprocessingConfig?: PreprocessingConfig // NOVO
    ) {
        return this.percentileService.calculateAllPercentiles(
            stationId,
            dateRange,
            preprocessingConfig // NOVO
        );
    }

    async handleCalculateCustomPercentiles(
        stationId: string,
        percentiles: number[],
        dateRange?: DateRange,
        preprocessingConfig?: PreprocessingConfig // NOVO
    ) {
        return this.percentileService.calculateCustomPercentiles(
            stationId,
            percentiles,
            dateRange,
            preprocessingConfig // NOVO
        );
    }

    async handleCalculateCustomPercentilesWithMethod(
        stationId: string,
        percentiles: number[],
        method: PercentileMethod,
        dateRange?: DateRange,
        preprocessingConfig?: PreprocessingConfig // NOVO
    ) {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        if (!percentiles || percentiles.length === 0) {
            return { success: false, error: "At least one percentile value is required" };
        }

        for (const p of percentiles) {
            if (p < 0 || p > 100) {
                return {
                    success: false,
                    error: `Invalid percentile value: ${p}. Must be between 0 and 100`,
                };
            }
        }

        const results = [];
        for (const p of percentiles) {
            const result = await this.percentileService.calculatePercentileWithMethod(
                stationId,
                p,
                method,
                dateRange,
                preprocessingConfig // NOVO
            );
            if (!result.success) {
                return result;
            }
            results.push(result.data);
        }

        return { success: true, data: results };
    }

    async handleCalculateFlowDurationCurve(
        stationId: string,
        dateRange?: DateRange,
        numberOfPoints: number = 100,
        preprocessingConfig?: PreprocessingConfig // NOVO
    ) {
        return this.percentileService.calculateFlowDurationCurve(
            stationId,
            dateRange,
            numberOfPoints,
            preprocessingConfig // NOVO
        );
    }
}
