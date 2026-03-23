import { ExportService, ExportFormat, StationExportResult } from "../services/export.service";

interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export class ExportController {
    private exportService: ExportService;

    constructor(exportService: ExportService) {
        this.exportService = exportService;
    }

    async handleExportStations(
        stationIds: string[],
        format: ExportFormat,
        startDate?: string,
        endDate?: string
    ): Promise<ServiceResponse<StationExportResult[]>> {
        return this.exportService.exportStations(stationIds, format, startDate, endDate);
    }
}