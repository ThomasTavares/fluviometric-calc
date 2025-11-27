import { ServiceResponse, DailyFlowsRow } from "../backend/services/streamflow.service";
import { FlowDurationCurveData } from "../backend/services/calculations/percentile.service";

export interface BackendAPI {
    stations: {
        getAll: () => Promise<any>;
        getById: (id: string) => Promise<any>;
        search: (filters: {
            name?: string;
            basin_code?: string;
            sub_basin_code?: string;
            river_name?: string;
            state_name?: string;
            city_name?: string;
        }) => Promise<any>;
        count: () => Promise<any>;
        import: () => Promise<any>;
    };

    streamflow: {
        getForExport: (stationId: string, startDate?: string, endDate?: string) => Promise<ServiceResponse<DailyFlowsRow[]>>;
    };

    analysis: {
        //calculatePercentile: (stationId: string, percentile: number, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //calculatePercentileWithMethod: (stationId: string, percentile: number, method: string, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //compareAllPercentileMethods: (stationId: string, percentile: number, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //comparePercentileMethods: (stationId: string, percentile: number, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //calculateAllPercentiles: (stationId: string, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //calculateCustomPercentiles: (stationId: string, percentiles: number[], dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        //calculateCustomPercentilesWithMethod: (stationId: string, percentiles: number[], method: string, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
        calculateFlowDurationCurve: (stationId: string, dateRange?: { startDate: string; endDate: string }, numberOfPoints?: number) => Promise<ServiceResponse<FlowDurationCurveData>>;
        calculateQ710: (stationId: string, dateRange?: { startDate: string; endDate: string }) => Promise<any>;
    };
}

declare global {
    interface Window {
        backendApi: BackendAPI;
    }
}

export {};