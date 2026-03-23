import Database from "better-sqlite3";
import * as ExcelJS from "exceljs";
import { StreamflowService, DailyFlowsRow } from "./streamflow.service";

interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export type ExportFormat = "csv" | "xlsx";

export interface StationExportResult {
    stationId: string;
    format: ExportFormat;
    content: Buffer | string;
}

export class ExportService {
    private streamflowService: StreamflowService;

    constructor(db: Database.Database) {
        this.streamflowService = new StreamflowService(db);
    }

    async exportStations(
        stationIds: string[],
        format: ExportFormat,
        startDate?: string,
        endDate?: string
    ): Promise<ServiceResponse<StationExportResult[]>> {
        if (!stationIds || stationIds.length === 0) {
            return { success: false, error: "At least one station ID is required" };
        }

        const results: StationExportResult[] = [];
        const errors: string[] = [];

        for (const stationId of stationIds) {
            const dataResult = this.streamflowService.getStreamflowsForExport(
                stationId,
                startDate,
                endDate
            );

            if (!dataResult.success || !dataResult.data) {
                errors.push(`${stationId}: ${dataResult.error ?? "no data"}`);
                continue;
            }

            const content =
                format === "csv"
                    ? this.buildCsv(dataResult.data)
                    : await this.buildXlsx(stationId, dataResult.data);

            results.push({ stationId, format, content });
        }

        if (results.length === 0) {
            return { success: false, error: errors.join("; ") };
        }

        return { success: true, data: results };
    }

    private buildCsv(rows: DailyFlowsRow[]): string {
        const dayKeys = Array.from(
            { length: 31 },
            (_, i) => `Flow_${String(i + 1).padStart(2, "0")}`
        );

        const header = ["Estacao", "Ano", "Mes", ...dayKeys].join(",");

        const lines = rows.map((row) => {
            const days = dayKeys.map((key) => {
                const val = row[key as keyof DailyFlowsRow];
                return val !== null && val !== undefined ? String(val) : "";
            });
            return [row.station_id, row.year, row.month, ...days].join(",");
        });

        return [header, ...lines].join("\n");
    }

    private async buildXlsx(stationId: string, rows: DailyFlowsRow[]): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(stationId);

        const dayColumns = Array.from({ length: 31 }, (_, i) => {
            const padded = String(i + 1).padStart(2, "0");
            return { header: `Dia_${padded}`, key: `Flow_${padded}`, width: 10 };
        });

        sheet.columns = [
            { header: "Estacao", key: "station_id", width: 14 },
            { header: "Ano",     key: "year",       width: 8  },
            { header: "Mes",     key: "month",      width: 6  },
            ...dayColumns,
        ];

        for (const row of rows) {
            sheet.addRow(row);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
}