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

        // TODO: As bacias e subbacias também são dividas por códigos:
        // ex: {número} - {nome bacia}
        // pode ser que seja válido colocar esse filtro também por códigos no sistema 
        // ou até mesmo mudar no banco de dados acrescentando isso, tem que ver

        if (filters.name) {
            query += ` AND name LIKE ?`;
            params.push(`%${filters.name}%`);
        }

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