import Database from "better-sqlite3";
import { ANAApiService } from "./ana-api.service";

export interface SyncProgress {
    windowsCompleted: number;
    totalWindows: number;
    currentWindow: string;
    recordsInserted: number;
    recordsUpdated: number;
}

export interface SyncResult {
    success: boolean;
    cancelled: boolean;
    stationId: string;
    stationCreated: boolean;
    period: {
        start: string;
        end: string;
    };
    windows: {
        total: number;
        completed: number;
        failed: number;
    };
    records: {
        inserted: number;
        updated: number;
    };
    duration: number;
    errors: Array<{
        window: string;
        message: string;
    }>;
}

export type ProgressCallback = (progress: SyncProgress) => void;

interface DailyStreamflowInsert {
    station_id: string;
    date: string;
    flow_rate: number;
    status: number | null;
    consistency_level: number;
}

const PAUSE_BETWEEN_REQUESTS = 200;

export class DataSyncService {
    private db: Database.Database;
    private anaApiService: ANAApiService;
    private cancelled: boolean = false;

    constructor(database: Database.Database) {
        this.db = database;
        this.anaApiService = new ANAApiService();
    }

    async syncStation(
        cpf: string,
        password: string,
        stationCode: string,
        startDate: string,
        endDate: string,
        onProgress: ProgressCallback
    ): Promise<SyncResult> {
        const startTime = Date.now();
        this.cancelled = false;

        const authResult = await this.anaApiService.authenticate(cpf, password);
        if (!authResult.success || !authResult.token) {
            return this.buildErrorResult(stationCode, startDate, endDate, authResult.error || 'Falha na autenticação');
        }

        const token = authResult.token;
        const stationCreated = await this.ensureStationExists(stationCode);
        const windows = this.anaApiService.splitIntoAnnualWindows(startDate, endDate);

        let windowsCompleted = 0;
        let totalInserted = 0;
        let totalUpdated = 0;
        const errors: Array<{ window: string; message: string }> = [];

        for (const window of windows) {
            if (this.cancelled) {
                return this.buildCancelledResult(
                    stationCode,
                    stationCreated,
                    startDate,
                    endDate,
                    windows.length,
                    windowsCompleted,
                    totalInserted,
                    totalUpdated,
                    errors,
                    Date.now() - startTime
                );
            }

            try {
                const fetchResult = await this.anaApiService.fetchStreamflowData(
                    stationCode,
                    window.start,
                    window.end,
                    token
                );

                if (!fetchResult.success || !fetchResult.data) {
                    errors.push({
                        window: `${window.start} → ${window.end}`,
                        message: fetchResult.error || 'Falha ao buscar dados',
                    });
                    continue;
                }

                const dailyRecords = this.parseAPIDataToDailyRecords(stationCode, fetchResult.data);
                const { inserted, updated } = await this.upsertDailyStreamflows(dailyRecords);

                totalInserted += inserted;
                totalUpdated += updated;
                windowsCompleted++;

                onProgress({
                    windowsCompleted,
                    totalWindows: windows.length,
                    currentWindow: `${window.start} → ${window.end}`,
                    recordsInserted: totalInserted,
                    recordsUpdated: totalUpdated,
                });

                await this.sleep(PAUSE_BETWEEN_REQUESTS);
            } catch (error) {
                errors.push({
                    window: `${window.start} → ${window.end}`,
                    message: error instanceof Error ? error.message : 'Erro desconhecido',
                });
            }
        }

        return {
            success: true,
            cancelled: false,
            stationId: stationCode,
            stationCreated,
            period: { start: startDate, end: endDate },
            windows: {
                total: windows.length,
                completed: windowsCompleted,
                failed: errors.length,
            },
            records: {
                inserted: totalInserted,
                updated: totalUpdated,
            },
            duration: Date.now() - startTime,
            errors,
        };
    }

    cancel(): void {
        this.cancelled = true;
    }

    private async ensureStationExists(stationCode: string): Promise<boolean> {
        const existing = this.db.prepare('SELECT id FROM stations WHERE id = ?').get(stationCode);

        if (existing) {
            return false;
        }

        this.db.prepare(`
            INSERT INTO stations (
                id, name, type, basin_code, sub_basin_code, 
                river_name, state_name, city_name, 
                responsible_sigla, operator_sigla
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            stationCode,
            `Estação ${stationCode}`,
            'Fluviométrica',
            '',
            '',
            '',
            '',
            '',
            '',
            ''
        );

        return true;
    }

    private parseAPIDataToDailyRecords(stationCode: string, apiData: any[]): DailyStreamflowInsert[] {
        const records: DailyStreamflowInsert[] = [];

        for (const monthData of apiData) {
            if (!monthData.Data_Hora_Dado) continue;

            const dateStr = monthData.Data_Hora_Dado.split(' ')[0];
            const [year, month] = dateStr.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            const consistencyLevel = parseInt(monthData.Nivel_Consistencia) || 0;

            for (let day = 1; day <= daysInMonth; day++) {
                const flowKey = `Vazao_${String(day).padStart(2, '0')}`;
                const statusKey = `${flowKey}_Status`;

                if (monthData[flowKey] !== null && monthData[flowKey] !== undefined) {
                    const flowRate = parseFloat(monthData[flowKey]);

                    if (!isNaN(flowRate)) {
                        records.push({
                            station_id: stationCode,
                            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                            flow_rate: flowRate,
                            status: monthData[statusKey] ? parseInt(monthData[statusKey]) : null,
                            consistency_level: consistencyLevel,
                        });
                    }
                }
            }
        }

        return records;
    }

    private async upsertDailyStreamflows(records: DailyStreamflowInsert[]): Promise<{ inserted: number; updated: number }> {
        let inserted = 0;
        let updated = 0;

        const upsertStmt = this.db.prepare(`
            INSERT INTO daily_Streamflows (station_id, date, flow_rate, status, consistency_level)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(station_id, date) DO UPDATE SET
                flow_rate = excluded.flow_rate,
                status = excluded.status,
                consistency_level = excluded.consistency_level
            WHERE excluded.flow_rate IS NOT NULL
        `);

        const checkStmt = this.db.prepare(`
            SELECT id FROM daily_Streamflows WHERE station_id = ? AND date = ?
        `);

        const transaction = this.db.transaction((records: DailyStreamflowInsert[]) => {
            for (const record of records) {
                const existing = checkStmt.get(record.station_id, record.date);
                upsertStmt.run(
                    record.station_id,
                    record.date,
                    record.flow_rate,
                    record.status,
                    record.consistency_level
                );
                
                if (existing) {
                    updated++;
                } else {
                    inserted++;
                }
            }
        });

        transaction(records);

        return { inserted, updated };
    }

    private buildErrorResult(stationCode: string, startDate: string, endDate: string, errorMessage: string): SyncResult {
        return {
            success: false,
            cancelled: false,
            stationId: stationCode,
            stationCreated: false,
            period: { start: startDate, end: endDate },
            windows: { total: 0, completed: 0, failed: 0 },
            records: { inserted: 0, updated: 0 },
            duration: 0,
            errors: [{ window: 'Autenticação', message: errorMessage }],
        };
    }

    private buildCancelledResult(
        stationCode: string,
        stationCreated: boolean,
        startDate: string,
        endDate: string,
        totalWindows: number,
        completed: number,
        inserted: number,
        updated: number,
        errors: Array<{ window: string; message: string }>,
        duration: number
    ): SyncResult {
        return {
            success: false,
            cancelled: true,
            stationId: stationCode,
            stationCreated,
            period: { start: startDate, end: endDate },
            windows: { total: totalWindows, completed, failed: errors.length },
            records: { inserted, updated },
            duration,
            errors,
        };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
