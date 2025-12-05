import { ServiceResponse, DailyFlowsRow } from "../../backend/services/streamflow.service";

export interface DateRangeInfo {
    min_date: string;
    max_date: string;
    total_records: number;
}

export interface NullFlowsSummary {
    total_records: number;
    null_count: number;
    zero_count: number;
    valid_count: number;
    completeness_percentage: number;
}

export const getAvailableDateRange = async (stationId: string): Promise<ServiceResponse<DateRangeInfo>> => {
    try {
        return await window.backendApi.streamflow.getAvailableDateRange(stationId);
    } catch (error) {
        console.error("Error getting date range:", error);
        return { success: false, error: "Error fetching date range" };
    }
};

export const getNullFlowsSummary = async (
    stationId: string,
    startDate?: string,
    endDate?: string
): Promise<ServiceResponse<NullFlowsSummary>> => {
    try {
        return await window.backendApi.streamflow.getNullFlowsSummary(stationId, startDate, endDate);
    } catch (error) {
        console.error("Error getting null flows summary:", error);
        return { success: false, error: "Error fetching null flows summary" };
    }
};

export const getStreamflowData = async (
    stationId: string,
    startDate?: string,
    endDate?: string
): Promise<ServiceResponse<DailyFlowsRow[]>> => {
    try {
        return await window.backendApi.streamflow.getForExport(stationId, startDate, endDate);
    } catch (error) {
        console.error("Error getting streamflow data:", error);
        return { success: false, error: "Error fetching streamflow data" };
    }
};
