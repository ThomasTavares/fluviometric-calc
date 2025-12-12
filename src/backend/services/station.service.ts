import Database from "better-sqlite3";
import { Station } from "../db/types";
import { safeDbQueryAll, safeDbQueryGet } from "../utils/db.util";

interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export class StationService {
    private db: Database.Database;

    constructor(database: Database.Database) {
        this.db = database;
    }

    getAllStations(): ServiceResponse<Station[]> {
        return safeDbQueryAll<Station>(
            this.db,
            `SELECT 
                id, name, type, additional_code, basin_code, sub_basin_code,
                river_name, state_name, city_name, responsible_sigla, operator_sigla,
                drainage_area, latitude, longitude, altitude, created_at
            FROM stations
            ORDER BY name ASC`,
            [],
            "fetching all stations"
        );
    }

    getStationById(id: string): ServiceResponse<Station> {
        if (!id || id.trim() === "") {
            return {
                success: false,
                error: "Station ID is required",
            };
        }

        const result = safeDbQueryGet<Station>(
            this.db,
            `SELECT 
                id, name, type, additional_code, basin_code, sub_basin_code,
                river_name, state_name, city_name, responsible_sigla, operator_sigla,
                drainage_area, latitude, longitude, altitude, created_at
            FROM stations
            WHERE id = ?`,
            [id],
            "fetching station by ID"
        );

        if (!result.success && result.error === "No results found") {
            return {
                success: false,
                error: "Station not found",
            };
        }

        return result;
    }

    updateStation(stationData: {
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
    }): ServiceResponse<{ updated: boolean }> {
        if (!stationData.id || stationData.id.trim() === "") {
            return {
                success: false,
                error: "Station ID is required",
            };
        }

        try {
            const existing = this.db.prepare("SELECT id FROM stations WHERE id = ?").get(stationData.id);
            
            if (!existing) {
                return {
                    success: false,
                    error: "Station not found",
                };
            }

            const updates: string[] = [];
            const params: any[] = [];

            if (stationData.name !== undefined) {
                updates.push("name = ?");
                params.push(stationData.name);
            }
            if (stationData.type !== undefined) {
                updates.push("type = ?");
                params.push(stationData.type);
            }
            if (stationData.additional_code !== undefined) {
                updates.push("additional_code = ?");
                params.push(stationData.additional_code);
            }
            if (stationData.basin_code !== undefined) {
                updates.push("basin_code = ?");
                params.push(stationData.basin_code);
            }
            if (stationData.sub_basin_code !== undefined) {
                updates.push("sub_basin_code = ?");
                params.push(stationData.sub_basin_code);
            }
            if (stationData.river_name !== undefined) {
                updates.push("river_name = ?");
                params.push(stationData.river_name);
            }
            if (stationData.state_name !== undefined) {
                updates.push("state_name = ?");
                params.push(stationData.state_name);
            }
            if (stationData.city_name !== undefined) {
                updates.push("city_name = ?");
                params.push(stationData.city_name);
            }
            if (stationData.responsible_sigla !== undefined) {
                updates.push("responsible_sigla = ?");
                params.push(stationData.responsible_sigla);
            }
            if (stationData.operator_sigla !== undefined) {
                updates.push("operator_sigla = ?");
                params.push(stationData.operator_sigla);
            }
            if (stationData.drainage_area !== undefined) {
                updates.push("drainage_area = ?");
                params.push(stationData.drainage_area);
            }
            if (stationData.latitude !== undefined) {
                updates.push("latitude = ?");
                params.push(stationData.latitude);
            }
            if (stationData.longitude !== undefined) {
                updates.push("longitude = ?");
                params.push(stationData.longitude);
            }
            if (stationData.altitude !== undefined) {
                updates.push("altitude = ?");
                params.push(stationData.altitude);
            }

            if (updates.length === 0) {
                return {
                    success: true,
                    data: { updated: false },
                };
            }

            params.push(stationData.id);
            const query = `UPDATE stations SET ${updates.join(", ")} WHERE id = ?`;

            this.db.prepare(query).run(...params);

            return {
                success: true,
                data: { updated: true },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to update station",
            };
        }
    }

    searchStations(filters: {
        name?: string;
        basin_code?: string;
        sub_basin_code?: string;
        river_name?: string;
        state_name?: string;
        city_name?: string;
    }): ServiceResponse<Station[]> {
        let query = `
            SELECT 
                id, name, type, additional_code, basin_code, sub_basin_code,
                river_name, state_name, city_name, responsible_sigla, operator_sigla,
                drainage_area, latitude, longitude, altitude, created_at
            FROM stations
            WHERE 1=1
        `;

        const params: any[] = [];

        if (filters.name) {
            query += ` AND name LIKE ?`;
            params.push(`%${filters.name}%`);
        }

        // TODO: As bacias e subbacias também são dividas por códigos:
        // ex: {número} - {nome bacia}
        // pode ser que seja válido colocar esse filtro também por códigos no sistema 
        // ou até mesmo mudar no banco de dados acrescentando isso, tem que ver
        if (filters.sub_basin_code) {
            query += ` AND sub_basin_code LIKE ?`;
            params.push(`%${filters.sub_basin_code}%`);
        }

        if (filters.basin_code) {
            query += ` AND basin_code LIKE ?`;
            params.push(`%${filters.basin_code}%`);
        }

        // TODO: Pelo site hidroweb, a lógica da busca pelo RIO depende da BACIA
        // tem que verificar pra que precisa e como implementaria isso aqui
        if (filters.river_name) {
            query += ` AND river_name LIKE ?`;
            params.push(`%${filters.river_name}%`);
        }

        if (filters.state_name) {
            query += ` AND state_name LIKE ?`;
            params.push(`%${filters.state_name}%`);
        }

        if (filters.city_name) {
            query += ` AND city_name LIKE ?`;
            params.push(`%${filters.city_name}%`);
        }
        // TODO: Falta as buscas por: TIPO, OPERANDO, RESPONSÁVEL e OPERADORA, 
        // mas tem que verificar até que ponto isso é útil pro sistema

        query += ` ORDER BY name ASC`;

        return safeDbQueryAll<Station>(
            this.db,
            query,
            params,
            "searching stations"
        );
    }

    getStationCount(): ServiceResponse<{ count: number }> {
        return safeDbQueryGet<{ count: number }>(
            this.db,
            "SELECT COUNT(*) as count FROM stations",
            [],
            "getting station count"
        );
    }
}
