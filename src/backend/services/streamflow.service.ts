import Database from "better-sqlite3";
import { safeDbQueryAll } from "../utils/db.util";

interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

interface DailyFlowsRow {
    station_id: string;
    year: number;
    month: number;
    date: string;
    Flow_01: number | null;
    Flow_02: number | null;
    Flow_03: number | null;
    Flow_04: number | null;
    Flow_05: number | null;
    Flow_06: number | null;
    Flow_07: number | null;
    Flow_08: number | null;
    Flow_09: number | null;
    Flow_10: number | null;
    Flow_11: number | null;
    Flow_12: number | null;
    Flow_13: number | null;
    Flow_14: number | null;
    Flow_15: number | null;
    Flow_16: number | null;
    Flow_17: number | null;
    Flow_18: number | null;
    Flow_19: number | null;
    Flow_20: number | null;
    Flow_21: number | null;
    Flow_22: number | null;
    Flow_23: number | null;
    Flow_24: number | null;
    Flow_25: number | null;
    Flow_26: number | null;
    Flow_27: number | null;
    Flow_28: number | null;
    Flow_29: number | null;
    Flow_30: number | null;
    Flow_31: number | null;
}

interface NullFlowAnalysis {
    station_id: string;
    year: number;
    month: number;
    total_days: number;
    null_count: number; 
    zero_count: number; 
    valid_count: number; 
    null_percentage: number;
    zero_percentage: number; 
    completeness: number; 
}

interface NullFlowSummary {
    station_id: string;
    period: {
        start: string;
        end: string;
    };
    total_records: number;
    total_null: number;
    total_zero: number;
    total_valid: number;
    overall_completeness: number;
    by_year: Array<{
        year: number;
        total_days: number;
        null_count: number;
        zero_count: number;
        valid_count: number;
        completeness: number;
    }>;
    by_month: NullFlowAnalysis[];
}


export class StreamflowService {
    private db: Database.Database;

    constructor(database: Database.Database) {
        this.db = database;
    }
    
    analyzeNullFlows(stationId: string, startDate?: string, endDate?: string): ServiceResponse<NullFlowSummary> {
        if (!stationId || stationId.trim() === "") {
            return {
                success: false,
                error: "Station ID is required",
            };
        }

        let monthlyQuery = `
            SELECT 
                station_id,
                strftime('%Y', date) as year,
                strftime('%m', date) as month,
                COUNT(*) as total_days,
                SUM(CASE WHEN flow_rate IS NULL THEN 1 ELSE 0 END) as null_count,
                SUM(CASE WHEN flow_rate = 0 THEN 1 ELSE 0 END) as zero_count,
                SUM(CASE WHEN flow_rate IS NOT NULL AND flow_rate != 0 THEN 1 ELSE 0 END) as valid_count
            FROM daily_Streamflows
            WHERE station_id = ?
        `;

        const params: any[] = [stationId];

        if (startDate) {
            monthlyQuery += ` AND date >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            monthlyQuery += ` AND date <= ?`;
            params.push(endDate);
        }

        monthlyQuery += `
            GROUP BY strftime('%Y', date), strftime('%m', date)
            ORDER BY year, month
        `;

        const monthlyResult = safeDbQueryAll<{
            station_id: string;
            year: string;
            month: string;
            total_days: number;
            null_count: number;
            zero_count: number;
            valid_count: number;
        }>(this.db, monthlyQuery, params, "analyzing null flows by month");

        if (!monthlyResult.success) {
            return monthlyResult as ServiceResponse<NullFlowSummary>;
        }

        const monthlyData = monthlyResult.data || [];

        const byMonth: NullFlowAnalysis[] = monthlyData.map((row) => ({
            station_id: row.station_id,
            year: parseInt(row.year),
            month: parseInt(row.month),
            total_days: row.total_days,
            null_count: row.null_count,
            zero_count: row.zero_count,
            valid_count: row.valid_count,
            null_percentage: (row.null_count / row.total_days) * 100,
            zero_percentage: (row.zero_count / row.total_days) * 100,
            completeness: (row.valid_count / row.total_days) * 100,
        }));

        const yearMap = new Map<
            number,
            {
                total_days: number;
                null_count: number;
                zero_count: number;
                valid_count: number;
            }
        >();

        byMonth.forEach((month) => {
            const existing = yearMap.get(month.year) || {
                total_days: 0,
                null_count: 0,
                zero_count: 0,
                valid_count: 0,
            };

            yearMap.set(month.year, {
                total_days: existing.total_days + month.total_days,
                null_count: existing.null_count + month.null_count,
                zero_count: existing.zero_count + month.zero_count,
                valid_count: existing.valid_count + month.valid_count,
            });
        });

        const byYear = Array.from(yearMap.entries())
            .map(([year, data]) => ({
                year,
                total_days: data.total_days,
                null_count: data.null_count,
                zero_count: data.zero_count,
                valid_count: data.valid_count,
                completeness: (data.valid_count / data.total_days) * 100,
            }))
            .sort((a, b) => a.year - b.year);

        const total_records = byMonth.reduce((sum, m) => sum + m.total_days, 0);
        const total_null = byMonth.reduce((sum, m) => sum + m.null_count, 0);
        const total_zero = byMonth.reduce((sum, m) => sum + m.zero_count, 0);
        const total_valid = byMonth.reduce((sum, m) => sum + m.valid_count, 0);

        const dates = byMonth.map((m) => `${m.year}-${String(m.month).padStart(2, "0")}`);
        const period = {
            start: dates.length > 0 ? dates[0] + "-01" : "",
            end: dates.length > 0 ? dates[dates.length - 1] + "-01" : "",
        };

        return {
            success: true,
            data: {
                station_id: stationId,
                period,
                total_records,
                total_null,
                total_zero,
                total_valid,
                overall_completeness: total_records > 0 ? (total_valid / total_records) * 100 : 0,
                by_year: byYear,
                by_month: byMonth,
            },
        };
    }

    getNullFlowsSummary(
        stationId: string,
        startDate?: string,
        endDate?: string
    ): ServiceResponse<{
        total_records: number;
        null_count: number;
        zero_count: number;
        valid_count: number;
        completeness_percentage: number;
    }> {
        if (!stationId || stationId.trim() === "") {
            return {
                success: false,
                error: "Station ID is required",
            };
        }

        let query = `
            SELECT 
                COUNT(*) as total_records,
                SUM(CASE WHEN flow_rate IS NULL THEN 1 ELSE 0 END) as null_count,
                SUM(CASE WHEN flow_rate = 0 THEN 1 ELSE 0 END) as zero_count,
                SUM(CASE WHEN flow_rate IS NOT NULL AND flow_rate != 0 THEN 1 ELSE 0 END) as valid_count
            FROM daily_Streamflows
            WHERE station_id = ?
        `;

        const params: any[] = [stationId];

        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate);
        }

        const result = safeDbQueryAll<{
            total_records: number;
            null_count: number;
            zero_count: number;
            valid_count: number;
        }>(this.db, query, params, "getting null flows summary");

        if (!result.success || !result.data || result.data.length === 0) {
            return result as ServiceResponse<any>;
        }

        const data = result.data[0];

        return {
            success: true,
            data: {
                ...data,
                completeness_percentage: data.total_records > 0 ? (data.valid_count / data.total_records) * 100 : 0,
            },
        };
    }

    getStreamflowsForExport(stationId: string, startDate?: string, endDate?: string): ServiceResponse<DailyFlowsRow[]> {
        if (!stationId || stationId.trim() === "") {
            return {
                success: false,
                error: "Station ID is required",
            };
        }

        let query = `
            SELECT 
                station_id,
                strftime('%Y', date) as year,
                strftime('%m', date) as month,
                strftime('%Y-%m', date) as date
            FROM daily_Streamflows
            WHERE station_id = ?
        `;

        const params: any[] = [stationId];

        if (startDate) {
            query += ` AND date >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND date <= ?`;
            params.push(endDate);
        }

        query += ` GROUP BY strftime('%Y-%m', date) ORDER BY date ASC`;

        const monthsResult = safeDbQueryAll<{ station_id: string; year: string; month: string; date: string }>(
            this.db,
            query,
            params,
            "fetching months for export"
        );

        if (!monthsResult.success) {
            return monthsResult as ServiceResponse<DailyFlowsRow[]>;
        }

        const months = monthsResult.data || [];
        const result: DailyFlowsRow[] = [];

        for (const monthInfo of months) {
            const dailyQuery = `
                SELECT 
                    strftime('%d', date) as day,
                    flow_rate
                FROM daily_Streamflows
                WHERE station_id = ? 
                AND strftime('%Y-%m', date) = ?
                ORDER BY date ASC
            `;

            const dailyResult = safeDbQueryAll<{ day: string; flow_rate: number | null }>(
                this.db,
                dailyQuery,
                [stationId, monthInfo.date],
                "fetching daily flows for month"
            );

            if (!dailyResult.success) {
                continue;
            }

            const row: DailyFlowsRow = {
                station_id: stationId,
                year: parseInt(monthInfo.year),
                month: parseInt(monthInfo.month),
                date: monthInfo.date,
                Flow_01: null,
                Flow_02: null,
                Flow_03: null,
                Flow_04: null,
                Flow_05: null,
                Flow_06: null,
                Flow_07: null,
                Flow_08: null,
                Flow_09: null,
                Flow_10: null,
                Flow_11: null,
                Flow_12: null,
                Flow_13: null,
                Flow_14: null,
                Flow_15: null,
                Flow_16: null,
                Flow_17: null,
                Flow_18: null,
                Flow_19: null,
                Flow_20: null,
                Flow_21: null,
                Flow_22: null,
                Flow_23: null,
                Flow_24: null,
                Flow_25: null,
                Flow_26: null,
                Flow_27: null,
                Flow_28: null,
                Flow_29: null,
                Flow_30: null,
                Flow_31: null,
            };

            for (const daily of dailyResult.data || []) {
                const paddedDay = daily.day.padStart(2, "0");
                const key = `Flow_${paddedDay}` as keyof DailyFlowsRow;
                if (key in row) {
                    (row as any)[key] = daily.flow_rate;
                }
            }

            result.push(row);
        }

        return {
            success: true,
            data: result,
        };
    }
}
