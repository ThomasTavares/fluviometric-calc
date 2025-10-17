import { PercentileService, PercentileMethod } from "../services/calculations/percentile.service";

interface DateRange {
    startDate?: string;
    endDate?: string;
}

export class PercentileController {
    private percentileService: PercentileService;

    constructor(percentileService: PercentileService) {
        this.percentileService = percentileService;
    }

    async handleCalculatePercentile(stationId: string, percentile: number, dateRange?: DateRange) {
        return this.percentileService.calculatePercentile(stationId, percentile, dateRange);
    }

    async handleCalculatePercentileWithMethod(
        stationId: string, 
        percentile: number, 
        method: PercentileMethod,
        dateRange?: DateRange
    ) {
        return this.percentileService.calculatePercentileWithMethod(stationId, percentile, method, dateRange);
    }

    async handleCompareAllPercentileMethods(stationId: string, percentile: number, dateRange?: DateRange) {
        return this.percentileService.compareAllPercentileMethods(stationId, percentile, dateRange);
    }


    async handleComparePercentileMethods(stationId: string, percentile: number, dateRange?: DateRange) {
        return this.percentileService.comparePercentileMethods(stationId, percentile, dateRange);
    }

    async handleCalculateAllPercentiles(stationId: string, dateRange?: DateRange) {
        return this.percentileService.calculateAllPercentiles(stationId, dateRange);
    }


    async handleCalculateCustomPercentiles(stationId: string, percentiles: number[], dateRange?: DateRange) {
        return this.percentileService.calculateCustomPercentiles(stationId, percentiles, dateRange);
    }

    async handleCalculateCustomPercentilesWithMethod(
        stationId: string, 
        percentiles: number[], 
        method: PercentileMethod,
        dateRange?: DateRange
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
                dateRange
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
        numberOfPoints: number = 100
    ) {
        return this.percentileService.calculateFlowDurationCurve(stationId, dateRange, numberOfPoints);
    }
}