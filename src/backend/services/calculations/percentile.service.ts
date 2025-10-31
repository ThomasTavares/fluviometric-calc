import Database from "better-sqlite3";
import { safeDbQueryAll } from "../../utils/db.util";
import { getValidFlowsWithPreprocessing } from "../../utils/preprocessing.util";
import { PreprocessingConfig, PreprocessingOptions, ServiceResponse } from "../../types/preprocessing.types";

interface PercentileResult {
    percentile: number;
    value: number;
}

interface AllPercentilesResult {
    station_id: string;
    total_records: number;
    date_range?: {
        start_date: string;
        end_date: string;
    };
    percentiles: {
        Q95: number;
        Q90: number;
        Q85: number;
        Q80: number;
        Q75: number;
        Q70: number;
        Q65: number;
        Q60: number;
        Q55: number;
        Q50: number;
    };
}

interface FlowDurationCurveData {
    station_id: string;
    total_records: number;
    date_range?: {
        start_date: string;
        end_date: string;
    };
    curve_points: {
        percentile: number;
        flow_rate: number;
        frequency_percent: number;
    }[];
}

export type PercentileMethod = "weibull";

interface DateRange {
    startDate?: string;
    endDate?: string;
}

export class PercentileService {
    private db: Database.Database;

    constructor(database: Database.Database) {
        this.db = database;
    }

    calculatePercentile(
        stationId: string,
        percentile: number,
        dateRange?: DateRange,
        preprocessingOptions?: PreprocessingOptions
    ): ServiceResponse<PercentileResult> {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        if (percentile < 0 || percentile > 100) {
            return { success: false, error: "Percentile must be between 0 and 100" };
        }

        const flowRatesResult = this.getFlowRates(stationId, dateRange, preprocessingOptions);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;
        const percentileValue = this.computePercentile(flowRates, percentile);

        return {
            success: true,
            data: { percentile, value: Number(percentileValue.toFixed(4)) },
        };
    }

    calculatePercentileWithMethod(
        stationId: string,
        percentile: number,
        method: PercentileMethod,
        dateRange?: DateRange,
        preprocessingOptions?: PreprocessingOptions
    ): ServiceResponse<PercentileResult> {
        // Método sempre será Weibull, mas mantemos a assinatura por compatibilidade
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        if (percentile < 0 || percentile > 100) {
            return { success: false, error: "Percentile must be between 0 and 100" };
        }

        const flowRatesResult = this.getFlowRates(stationId, dateRange, preprocessingOptions);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;
        const percentileValue = this.computePercentile(flowRates, percentile);

        return {
            success: true,
            data: { percentile, value: Number(percentileValue.toFixed(4)) },
        };
    }

    calculateAllPercentiles(
        stationId: string,
        dateRange?: DateRange,
        preprocessingOptions?: PreprocessingOptions
    ): ServiceResponse<AllPercentilesResult> {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        const flowRatesResult = this.getFlowRates(stationId, dateRange, preprocessingOptions);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;

        const percentiles = {
            Q95: Number(this.computePercentile(flowRates, 95).toFixed(4)),
            Q90: Number(this.computePercentile(flowRates, 90).toFixed(4)),
            Q85: Number(this.computePercentile(flowRates, 85).toFixed(4)),
            Q80: Number(this.computePercentile(flowRates, 80).toFixed(4)),
            Q75: Number(this.computePercentile(flowRates, 75).toFixed(4)),
            Q70: Number(this.computePercentile(flowRates, 70).toFixed(4)),
            Q65: Number(this.computePercentile(flowRates, 65).toFixed(4)),
            Q60: Number(this.computePercentile(flowRates, 60).toFixed(4)),
            Q55: Number(this.computePercentile(flowRates, 55).toFixed(4)),
            Q50: Number(this.computePercentile(flowRates, 50).toFixed(4)),
        };

        return {
            success: true,
            data: {
                station_id: stationId,
                total_records: flowRates.length,
                date_range:
                    dateRange?.startDate || dateRange?.endDate
                        ? {
                              start_date: dateRange.startDate || "N/A",
                              end_date: dateRange.endDate || "N/A",
                          }
                        : undefined,
                percentiles,
            },
        };
    }

    calculateCustomPercentiles(
        stationId: string,
        percentiles: number[],
        dateRange?: DateRange,
        preprocessingOptions?: PreprocessingOptions
    ): ServiceResponse<PercentileResult[]> {
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

        const flowRatesResult = this.getFlowRates(stationId, dateRange, preprocessingOptions);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;

        const results: PercentileResult[] = percentiles.map((p) => ({
            percentile: p,
            value: Number(this.computePercentile(flowRates, p).toFixed(4)),
        }));

        return { success: true, data: results };
    }

    calculateFlowDurationCurve(
        stationId: string,
        dateRange?: DateRange,
        numberOfPoints: number = 100,
        preprocessingOptions?: PreprocessingOptions
    ): ServiceResponse<FlowDurationCurveData> {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        if (numberOfPoints < 2 || numberOfPoints > 1000) {
            return { success: false, error: "Number of points must be between 2 and 1000" };
        }

        const flowRatesResult = this.getFlowRates(stationId, dateRange, preprocessingOptions);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;

        const percentiles: number[] = [];
        for (let i = 0; i <= numberOfPoints; i++) {
            percentiles.push((i / numberOfPoints) * 100);
        }

        const curvePoints = percentiles.map((p) => ({
            percentile: Number(p.toFixed(2)),
            flow_rate: Number(this.computePercentile(flowRates, p).toFixed(4)),
            frequency_percent: Number((100 - p).toFixed(2)),
        }));

        return {
            success: true,
            data: {
                station_id: stationId,
                total_records: flowRates.length,
                date_range:
                    dateRange?.startDate || dateRange?.endDate
                        ? {
                              start_date: dateRange.startDate || "N/A",
                              end_date: dateRange.endDate || "N/A",
                          }
                        : undefined,
                curve_points: curvePoints,
            },
        };
    }

    private getFlowRates(
        stationId: string,
        dateRange?: DateRange,
        preprocessingOptions?: PreprocessingOptions
    ): ServiceResponse<number[]> {
        // Se tem pré-processamento, usa a utility
        if (preprocessingOptions && preprocessingOptions.mode && preprocessingOptions.mode !== "none") {
            // Monta a config COMPLETA (com stationId) para passar para a utility
            const config: PreprocessingConfig = {
                stationId,
                startDate: dateRange?.startDate,
                endDate: dateRange?.endDate,
                mode: preprocessingOptions.mode,
                maxFailurePercentage: preprocessingOptions.maxFailurePercentage,
            };

            return getValidFlowsWithPreprocessing(this.db, config);
        }

        // Comportamento padrão/legacy (ignora apenas NULL e ZERO)
        let query = `
            SELECT flow_rate 
            FROM daily_streamflows 
            WHERE station_id = ? 
            AND flow_rate IS NOT NULL 
            AND flow_rate > 0
        `;

        const params: any[] = [stationId];

        if (dateRange?.startDate) {
            query += ` AND date >= ?`;
            params.push(dateRange.startDate);
        }

        if (dateRange?.endDate) {
            query += ` AND date <= ?`;
            params.push(dateRange.endDate);
        }

        query += ` ORDER BY flow_rate DESC`;

        const flowRatesResult = safeDbQueryAll<{ flow_rate: number }>(this.db, query, params, "fetching flow rates");

        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        if (!flowRatesResult.data || flowRatesResult.data.length === 0) {
            const dateInfo = dateRange?.startDate || dateRange?.endDate ? ` for the specified date range` : "";
            return {
                success: false,
                error: `No valid flow rate data found for this station${dateInfo}`,
            };
        }

        return {
            success: true,
            data: flowRatesResult.data.map((row) => row.flow_rate),
        };
    }

    private computePercentile(sortedData: number[], percentile: number): number {
        if (sortedData.length === 0) {
            throw new Error("Cannot compute percentile of empty array");
        }

        if (sortedData.length === 1) {
            return sortedData[0];
        }

        // Método Weibull (único método disponível)
        return this.weibullMethod(sortedData, percentile);
    }

    private weibullMethod(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const position = p * (n + 1);
        const index = position - 1;

        if (index <= 0) return sortedData[0];
        if (index >= n - 1) return sortedData[n - 1];

        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);

        if (lowerIndex === upperIndex) {
            return sortedData[lowerIndex];
        }

        const lowerValue = sortedData[lowerIndex];
        const upperValue = sortedData[upperIndex];
        const fraction = index - lowerIndex;

        return lowerValue + (upperValue - lowerValue) * fraction;
    }
}
