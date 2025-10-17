import Database from "better-sqlite3";
import { safeDbQueryAll } from "../../utils/db.util";

interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

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

interface ExtendedComparisonResult {
    station_id: string;
    total_records: number;
    percentile: number;
    date_range?: {
        start_date: string;
        end_date: string;
    };
    methods: {
        weibull: number;
        cunnane: number;
        gringorten: number;

        linear_interpolation: number;
        excel_percentile_inc: number;
        excel_percentile_exc: number;
        nearest_rank: number;
        lower_value: number;
        higher_value: number;

        type1: number;
        type2: number;
        type3: number;
        type4: number;
        type5: number;
        type6: number;
        type7: number;
        type8: number;
        type9: number;
    };
}

export type PercentileMethod =
    | "weibull"
    | "cunnane"
    | "gringorten"
    | "linear_interpolation"
    | "excel_percentile_inc"
    | "excel_percentile_exc"
    | "nearest_rank"
    | "lower_value"
    | "higher_value"
    | "type1"
    | "type2"
    | "type3"
    | "type4"
    | "type5"
    | "type6"
    | "type7"
    | "type8"
    | "type9";

interface DateRange {
    startDate?: string; // Formato: YYYY-MM-DD
    endDate?: string;   // Formato: YYYY-MM-DD
}

export class PercentileService {
    private db: Database.Database;

    constructor(database: Database.Database) {
        this.db = database;
    }

    calculatePercentile(
        stationId: string, 
        percentile: number, 
        dateRange?: DateRange
    ): ServiceResponse<PercentileResult> {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        if (percentile < 0 || percentile > 100) {
            return { success: false, error: "Percentile must be between 0 and 100" };
        }

        const flowRatesResult = this.getFlowRates(stationId, dateRange);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;
        const percentileValue = this.computePercentile(flowRates, percentile, "weibull");

        return {
            success: true,
            data: { percentile, value: Number(percentileValue.toFixed(4)) },
        };
    }

    calculatePercentileWithMethod(
        stationId: string,
        percentile: number,
        method: PercentileMethod,
        dateRange?: DateRange
    ): ServiceResponse<PercentileResult> {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        if (percentile < 0 || percentile > 100) {
            return { success: false, error: "Percentile must be between 0 and 100" };
        }

        const flowRatesResult = this.getFlowRates(stationId, dateRange);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;
        const percentileValue = this.computePercentile(flowRates, percentile, method);

        return {
            success: true,
            data: { percentile, value: Number(percentileValue.toFixed(4)) },
        };
    }

    compareAllPercentileMethods(
        stationId: string, 
        percentile: number,
        dateRange?: DateRange
    ): ServiceResponse<ExtendedComparisonResult> {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        if (percentile < 0 || percentile > 100) {
            return { success: false, error: "Percentile must be between 0 and 100" };
        }

        const flowRatesResult = this.getFlowRates(stationId, dateRange);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;

        const dateInfo = dateRange?.startDate || dateRange?.endDate 
            ? ` (${dateRange.startDate || 'início'} a ${dateRange.endDate || 'fim'})`
            : '';

        console.log(`\n${"=".repeat(80)}`);
        console.log(`COMPARAÇÃO DE MÉTODOS - Estação: ${stationId}${dateInfo} - Q${percentile}`);
        console.log(`Total de registros: ${flowRates.length}`);
        console.log(`Métodos recomendados para hidrologia: Weibull, Cunnane, Gringorten`);
        console.log(`${"=".repeat(80)}\n`);

        const methods: ExtendedComparisonResult["methods"] = {
            weibull: Number(this.computePercentile(flowRates, percentile, "weibull").toFixed(4)),
            cunnane: Number(this.computePercentile(flowRates, percentile, "cunnane").toFixed(4)),
            gringorten: Number(this.computePercentile(flowRates, percentile, "gringorten").toFixed(4)),
            linear_interpolation: Number(
                this.computePercentile(flowRates, percentile, "linear_interpolation").toFixed(4)
            ),
            excel_percentile_inc: Number(
                this.computePercentile(flowRates, percentile, "excel_percentile_inc").toFixed(4)
            ),
            excel_percentile_exc: Number(
                this.computePercentile(flowRates, percentile, "excel_percentile_exc").toFixed(4)
            ),
            nearest_rank: Number(this.computePercentile(flowRates, percentile, "nearest_rank").toFixed(4)),
            lower_value: Number(this.computePercentile(flowRates, percentile, "lower_value").toFixed(4)),
            higher_value: Number(this.computePercentile(flowRates, percentile, "higher_value").toFixed(4)),
            type1: Number(this.computePercentile(flowRates, percentile, "type1").toFixed(4)),
            type2: Number(this.computePercentile(flowRates, percentile, "type2").toFixed(4)),
            type3: Number(this.computePercentile(flowRates, percentile, "type3").toFixed(4)),
            type4: Number(this.computePercentile(flowRates, percentile, "type4").toFixed(4)),
            type5: Number(this.computePercentile(flowRates, percentile, "type5").toFixed(4)),
            type6: Number(this.computePercentile(flowRates, percentile, "type6").toFixed(4)),
            type7: Number(this.computePercentile(flowRates, percentile, "type7").toFixed(4)),
            type8: Number(this.computePercentile(flowRates, percentile, "type8").toFixed(4)),
            type9: Number(this.computePercentile(flowRates, percentile, "type9").toFixed(4)),
        };

        return {
            success: true,
            data: {
                station_id: stationId,
                total_records: flowRates.length,
                percentile,
                date_range: dateRange?.startDate || dateRange?.endDate ? {
                    start_date: dateRange.startDate || 'N/A',
                    end_date: dateRange.endDate || 'N/A'
                } : undefined,
                methods,
            },
        };
    }

    comparePercentileMethods(
        stationId: string, 
        percentile: number,
        dateRange?: DateRange
    ): ServiceResponse<any> {
        return this.compareAllPercentileMethods(stationId, percentile, dateRange);
    }

    calculateAllPercentiles(
        stationId: string,
        dateRange?: DateRange
    ): ServiceResponse<AllPercentilesResult> {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        const flowRatesResult = this.getFlowRates(stationId, dateRange);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;

        const percentiles = {
            Q95: Number(this.computePercentile(flowRates, 95, "weibull").toFixed(4)),
            Q90: Number(this.computePercentile(flowRates, 90, "weibull").toFixed(4)),
            Q85: Number(this.computePercentile(flowRates, 85, "weibull").toFixed(4)),
            Q80: Number(this.computePercentile(flowRates, 80, "weibull").toFixed(4)),
            Q75: Number(this.computePercentile(flowRates, 75, "weibull").toFixed(4)),
            Q70: Number(this.computePercentile(flowRates, 70, "weibull").toFixed(4)),
            Q65: Number(this.computePercentile(flowRates, 65, "weibull").toFixed(4)),
            Q60: Number(this.computePercentile(flowRates, 60, "weibull").toFixed(4)),
            Q55: Number(this.computePercentile(flowRates, 55, "weibull").toFixed(4)),
            Q50: Number(this.computePercentile(flowRates, 50, "weibull").toFixed(4)),
        };

        return {
            success: true,
            data: {
                station_id: stationId,
                total_records: flowRates.length,
                date_range: dateRange?.startDate || dateRange?.endDate ? {
                    start_date: dateRange.startDate || 'N/A',
                    end_date: dateRange.endDate || 'N/A'
                } : undefined,
                percentiles,
            },
        };
    }

    calculateCustomPercentiles(
        stationId: string, 
        percentiles: number[],
        dateRange?: DateRange
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

        const flowRatesResult = this.getFlowRates(stationId, dateRange);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;

        const results: PercentileResult[] = percentiles.map((p) => ({
            percentile: p,
            value: Number(this.computePercentile(flowRates, p, "weibull").toFixed(4)),
        }));

        return { success: true, data: results };
    }

    calculateFlowDurationCurve(
        stationId: string,
        dateRange?: DateRange,
        numberOfPoints: number = 100
    ): ServiceResponse<FlowDurationCurveData> {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        if (numberOfPoints < 2 || numberOfPoints > 1000) {
            return { success: false, error: "Number of points must be between 2 and 1000" };
        }

        const flowRatesResult = this.getFlowRates(stationId, dateRange);
        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        const flowRates = flowRatesResult.data!;

        const percentiles: number[] = [];
        for (let i = 0; i <= numberOfPoints; i++) {
            percentiles.push((i / numberOfPoints) * 100);
        }

        const curvePoints = percentiles.map(p => ({
            percentile: Number(p.toFixed(2)),
            flow_rate: Number(this.computePercentile(flowRates, p, "weibull").toFixed(4)),
            frequency_percent: Number((100 - p).toFixed(2))
        }));

        return {
            success: true,
            data: {
                station_id: stationId,
                total_records: flowRates.length,
                date_range: dateRange?.startDate || dateRange?.endDate ? {
                    start_date: dateRange.startDate || 'N/A',
                    end_date: dateRange.endDate || 'N/A'
                } : undefined,
                curve_points: curvePoints
            }
        };
    }

    private getFlowRates(stationId: string, dateRange?: DateRange): ServiceResponse<number[]> {
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

        const flowRatesResult = safeDbQueryAll<{ flow_rate: number }>(
            this.db,
            query,
            params,
            "fetching flow rates"
        );

        if (!flowRatesResult.success) {
            return { success: false, error: flowRatesResult.error };
        }

        if (!flowRatesResult.data || flowRatesResult.data.length === 0) {
            const dateInfo = dateRange?.startDate || dateRange?.endDate 
                ? ` for the specified date range`
                : '';
            return { 
                success: false, 
                error: `No valid flow rate data found for this station${dateInfo}` 
            };
        }

        return {
            success: true,
            data: flowRatesResult.data.map((row) => row.flow_rate),
        };
    }

    private computePercentile(sortedData: number[], percentile: number, method: PercentileMethod): number {
        if (sortedData.length === 0) {
            throw new Error("Cannot compute percentile of empty array");
        }

        if (sortedData.length === 1) {
            return sortedData[0];
        }

        switch (method) {
            case "weibull":
                return this.weibullMethod(sortedData, percentile);
            case "cunnane":
                return this.cunnaneMethod(sortedData, percentile);
            case "gringorten":
                return this.gringortenMethod(sortedData, percentile);
            case "linear_interpolation":
            case "excel_percentile_inc":
                return this.linearInterpolation(sortedData, percentile);
            case "excel_percentile_exc":
                return this.excelPercentileExc(sortedData, percentile);
            case "nearest_rank":
                return this.nearestRank(sortedData, percentile);
            case "lower_value":
                return this.lowerValue(sortedData, percentile);
            case "higher_value":
                return this.higherValue(sortedData, percentile);
            case "type1":
                return this.hyndmanFanType1(sortedData, percentile);
            case "type2":
                return this.hyndmanFanType2(sortedData, percentile);
            case "type3":
                return this.hyndmanFanType3(sortedData, percentile);
            case "type4":
                return this.hyndmanFanType4(sortedData, percentile);
            case "type5":
                return this.hyndmanFanType5(sortedData, percentile);
            case "type6":
                return this.hyndmanFanType6(sortedData, percentile);
            case "type7":
                return this.hyndmanFanType7(sortedData, percentile);
            case "type8":
                return this.hyndmanFanType8(sortedData, percentile);
            case "type9":
                return this.hyndmanFanType9(sortedData, percentile);
            default:
                return this.weibullMethod(sortedData, percentile);
        }
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

    private cunnaneMethod(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const position = p * (n + 0.2) + 0.4;
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

    private gringortenMethod(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const position = p * (n + 0.12) + 0.44;
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

    private linearInterpolation(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const position = (percentile / 100) * (n - 1);
        const lowerIndex = Math.floor(position);
        const upperIndex = Math.ceil(position);

        if (lowerIndex === upperIndex) {
            return sortedData[lowerIndex];
        }

        const lowerValue = sortedData[lowerIndex];
        const upperValue = sortedData[upperIndex];
        const fraction = position - lowerIndex;

        return lowerValue + (upperValue - lowerValue) * fraction;
    }

    private excelPercentileExc(sortedData: number[], percentile: number): number {
        const n = sortedData.length;

        if (percentile <= 0 || percentile >= 100) {
            return this.linearInterpolation(sortedData, percentile);
        }

        const k = (percentile / 100) * (n + 1);
        const position = k - 1;

        if (position < 0) return sortedData[0];
        if (position >= n - 1) return sortedData[n - 1];

        const lowerIndex = Math.floor(position);
        const upperIndex = Math.ceil(position);

        if (lowerIndex === upperIndex) {
            return sortedData[lowerIndex];
        }

        const lowerValue = sortedData[lowerIndex];
        const upperValue = sortedData[upperIndex];
        const fraction = position - lowerIndex;

        return lowerValue + (upperValue - lowerValue) * fraction;
    }

    private nearestRank(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const position = (percentile / 100) * (n - 1);
        const index = Math.round(position);
        return sortedData[index];
    }

    private lowerValue(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const position = (percentile / 100) * (n - 1);
        const index = Math.floor(position);
        return sortedData[index];
    }

    private higherValue(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const position = (percentile / 100) * (n - 1);
        const index = Math.ceil(position);
        return sortedData[index];
    }

    private hyndmanFanType1(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const h = n * p;
        const index = Math.ceil(h) - 1;
        return sortedData[Math.max(0, Math.min(index, n - 1))];
    }

    private hyndmanFanType2(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const h = n * p;

        if (h === Math.floor(h)) {
            const index = Math.floor(h) - 1;
            if (index < 0) return sortedData[0];
            if (index >= n - 1) return sortedData[n - 1];
            return (sortedData[index] + sortedData[index + 1]) / 2;
        }

        const index = Math.ceil(h) - 1;
        return sortedData[Math.max(0, Math.min(index, n - 1))];
    }

    private hyndmanFanType3(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const h = n * p;
        const index = Math.round(h) - 1;
        return sortedData[Math.max(0, Math.min(index, n - 1))];
    }

    private hyndmanFanType4(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const h = n * p;
        const lower = Math.floor(h) - 1;
        const upper = Math.ceil(h) - 1;

        if (lower < 0) return sortedData[0];
        if (upper >= n) return sortedData[n - 1];
        if (lower === upper) return sortedData[lower];

        const fraction = h - Math.floor(h);
        return sortedData[lower] + fraction * (sortedData[upper] - sortedData[lower]);
    }

    private hyndmanFanType5(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const h = n * p + 0.5;
        const lower = Math.floor(h) - 1;
        const upper = Math.ceil(h) - 1;

        if (lower < 0) return sortedData[0];
        if (upper >= n) return sortedData[n - 1];
        if (lower === upper) return sortedData[lower];

        const fraction = h - Math.floor(h);
        return sortedData[lower] + fraction * (sortedData[upper] - sortedData[lower]);
    }

    private hyndmanFanType6(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const h = (n + 1) * p;
        const lower = Math.floor(h) - 1;
        const upper = Math.ceil(h) - 1;

        if (lower < 0) return sortedData[0];
        if (upper >= n) return sortedData[n - 1];
        if (lower === upper) return sortedData[lower];

        const fraction = h - Math.floor(h);
        return sortedData[lower] + fraction * (sortedData[upper] - sortedData[lower]);
    }

    private hyndmanFanType7(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const h = (n - 1) * p + 1;
        const lower = Math.floor(h) - 1;
        const upper = Math.ceil(h) - 1;

        if (lower < 0) return sortedData[0];
        if (upper >= n) return sortedData[n - 1];
        if (lower === upper) return sortedData[lower];

        const fraction = h - Math.floor(h);
        return sortedData[lower] + fraction * (sortedData[upper] - sortedData[lower]);
    }

    private hyndmanFanType8(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const h = (n + 1 / 3) * p + 1 / 3;
        const lower = Math.floor(h) - 1;
        const upper = Math.ceil(h) - 1;

        if (lower < 0) return sortedData[0];
        if (upper >= n) return sortedData[n - 1];
        if (lower === upper) return sortedData[lower];

        const fraction = h - Math.floor(h);
        return sortedData[lower] + fraction * (sortedData[upper] - sortedData[lower]);
    }

    private hyndmanFanType9(sortedData: number[], percentile: number): number {
        const n = sortedData.length;
        const p = percentile / 100;
        const h = (n + 1 / 4) * p + 3 / 8;
        const lower = Math.floor(h) - 1;
        const upper = Math.ceil(h) - 1;

        if (lower < 0) return sortedData[0];
        if (upper >= n) return sortedData[n - 1];
        if (lower === upper) return sortedData[lower];

        const fraction = h - Math.floor(h);
        return sortedData[lower] + fraction * (sortedData[upper] - sortedData[lower]);
    }
}