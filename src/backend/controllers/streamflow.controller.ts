import { StreamflowService } from "../services/streamflow.service";

export class StreamflowController {
    private streamflowService: StreamflowService;

    constructor(streamflowService: StreamflowService) {
        this.streamflowService = streamflowService;
    }

    async handleGetStreamflowsForExport(stationId: string, startDate?: string, endDate?: string) {
        return this.streamflowService.getStreamflowsForExport(stationId, startDate, endDate);
    }

    analyzeNullFlows(stationId: string, startDate?: string, endDate?: string) {
        if (!stationId || typeof stationId !== "string") {
            return {
                success: false,
                error: "Valid station ID is required",
            };
        }
        return this.streamflowService.analyzeNullFlows(stationId, startDate, endDate);
    }

    getNullFlowsSummary(stationId: string, startDate?: string, endDate?: string) {
        if (!stationId || typeof stationId !== "string") {
            return {
                success: false,
                error: "Valid station ID is required",
            };
        }

        return this.streamflowService.getNullFlowsSummary(stationId, startDate, endDate);
    }
}
