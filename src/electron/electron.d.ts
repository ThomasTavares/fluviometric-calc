import { ServiceResponse, DailyFlowsRow } from "../backend/services/streamflow.service";
import { FlowDurationCurveData } from "../backend/services/calculations/percentile.service";

interface DateRangeInfo {
    min_date: string;
    max_date: string;
    total_records: number;
}

interface NullFlowsSummary {
    total_records: number;
    null_count: number;
    zero_count: number;
    valid_count: number;
    completeness_percentage: number;
}

export interface BackendAPI {
    stations: {
        getAll: () => Promise<any>;
        getById: (id: string) => Promise<any>;
        update: (stationData: {
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
        }) => Promise<any>;
        search: (filters: {
            name?: string;
            basin_code?: string;
            sub_basin_code?: string;
            river_name?: string;
            state_name?: string;
            city_name?: string;
        }) => Promise<any>;
        count: () => Promise<any>;
    };

    streamflow: {
        getForExport: (
            stationId: string,
            startDate?: string,
            endDate?: string
        ) => Promise<ServiceResponse<DailyFlowsRow[]>>;
        analyzeNullFlows: (stationId: string, startDate?: string, endDate?: string) => Promise<ServiceResponse<any>>;
        getNullFlowsSummary: (
            stationId: string,
            startDate?: string,
            endDate?: string
        ) => Promise<ServiceResponse<NullFlowsSummary>>;
        getAvailableDateRange: (stationId: string) => Promise<ServiceResponse<DateRangeInfo>>;
    };

    analysis: {
        //calculatePercentile: (stationId: string, percentile: number, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //calculatePercentileWithMethod: (stationId: string, percentile: number, method: string, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //compareAllPercentileMethods: (stationId: string, percentile: number, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //comparePercentileMethods: (stationId: string, percentile: number, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //calculateAllPercentiles: (stationId: string, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //calculateCustomPercentiles: (stationId: string, percentiles: number[], dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //calculateCustomPercentilesWithMethod: (stationId: string, percentiles: number[], method: string, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        calculateFlowDurationCurve: (
            stationId: string,
            dateRange?: { startDate: string; endDate: string },
            numberOfPoints?: number
        ) => Promise<ServiceResponse<FlowDurationCurveData>>;
        calculateQ710: (stationId: string, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
    };
    sync: {
        execute: (params: {
            cpf: string;
            senha: string;
            stationCode: string;
            startDate: string;
            endDate: string;
        }) => Promise<any>;
        cancel: () => Promise<{ success: boolean; error?: string }>;
        onProgress: (
            callback: (progress: {
                windowsCompleted: number;
                totalWindows: number;
                currentWindow: string;
                recordsInserted: number;
                recordsUpdated: number;
            }) => void
        ) => void;
        removeProgressListener: () => void;
    };
}

declare global {
    interface Window {
        backendApi: BackendAPI;
    }
}

export {};
