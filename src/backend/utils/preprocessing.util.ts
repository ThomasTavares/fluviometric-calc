// src/backend/utils/preprocessing.util.ts

import Database from "better-sqlite3";
import { safeDbQueryAll } from "./db.util";
import { PreprocessingConfig, PreprocessingMode, ServiceResponse } from "../types/preprocessing.types";

/**
 * Busca flows válidos aplicando regras de pré-processamento
 * Usado por TODOS os services de cálculo (Q710, Percentile, etc)
 */
export function getValidFlowsWithPreprocessing(
    db: Database.Database,
    config: PreprocessingConfig
): ServiceResponse<number[]> {
    // Validações básicas
    if (!config.stationId || config.stationId.trim() === "") {
        return {
            success: false,
            error: "Station ID é obrigatório",
        };
    }

    // Se mode === 'none', busca todos os flows válidos (não-null, não-zero)
    if (config.mode === "none") {
        return getValidFlowsWithoutPreprocessing(db, config);
    }

    // Validação para modos com filtro
    if (
        config.maxFailurePercentage === undefined ||
        config.maxFailurePercentage < 0 ||
        config.maxFailurePercentage > 100
    ) {
        return {
            success: false,
            error: "Percentual máximo de falhas deve estar entre 0 e 100",
        };
    }

    // Aplica filtro mensal ou anual
    if (config.mode === "monthly") {
        return getValidFlowsMonthlyFiltered(db, config);
    } else if (config.mode === "annually") {
        return getValidFlowsAnnuallyFiltered(db, config);
    }

    return {
        success: false,
        error: `Modo de pré-processamento inválido: ${config.mode}`,
    };
}

/**
 * Busca flows válidos SEM pré-processamento (modo padrão/legacy)
 * Ignora apenas valores NULL e ZERO
 */
function getValidFlowsWithoutPreprocessing(
    db: Database.Database,
    config: PreprocessingConfig
): ServiceResponse<number[]> {
    try {
        let query = `
            SELECT flow_rate
            FROM daily_Streamflows
            WHERE station_id = ?
            AND flow_rate IS NOT NULL 
            AND flow_rate > 0.0
        `;

        const params: any[] = [config.stationId];

        if (config.startDate) {
            query += ` AND date >= ?`;
            params.push(config.startDate);
        }

        if (config.endDate) {
            query += ` AND date <= ?`;
            params.push(config.endDate);
        }

        query += ` ORDER BY date ASC`;

        const result = safeDbQueryAll<{ flow_rate: number }>(
            db,
            query,
            params,
            "fetching valid flows without preprocessing"
        );

        if (!result.success) {
            return result as ServiceResponse<number[]>;
        }

        const validFlows = (result.data || []).map((row) => row.flow_rate);

        if (validFlows.length === 0) {
            return {
                success: false,
                error: "Nenhuma vazão válida encontrada no período",
            };
        }

        return {
            success: true,
            data: validFlows,
        };
    } catch (error) {
        return {
            success: false,
            error: `Erro ao buscar flows: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Aplica filtro MENSAL de falhas
 */
function getValidFlowsMonthlyFiltered(db: Database.Database, config: PreprocessingConfig): ServiceResponse<number[]> {
    try {
        // 1. Analisar meses
        let monthlyQuery = `
            SELECT 
                strftime('%Y', date) as year,
                strftime('%m', date) as month,
                COUNT(*) as total_days,
                SUM(CASE WHEN flow_rate IS NULL THEN 1 ELSE 0 END) as null_days,
                SUM(CASE WHEN flow_rate = 0.0 THEN 1 ELSE 0 END) as zero_days
            FROM daily_Streamflows
            WHERE station_id = ?
        `;

        const params: any[] = [config.stationId];

        if (config.startDate) {
            monthlyQuery += ` AND date >= ?`;
            params.push(config.startDate);
        }

        if (config.endDate) {
            monthlyQuery += ` AND date <= ?`;
            params.push(config.endDate);
        }

        monthlyQuery += `
            GROUP BY strftime('%Y', date), strftime('%m', date)
            ORDER BY year, month
        `;

        const monthlyResult = safeDbQueryAll<{
            year: string;
            month: string;
            total_days: number;
            null_days: number;
            zero_days: number;
        }>(db, monthlyQuery, params, "analyzing months");

        if (!monthlyResult.success) {
            return monthlyResult as ServiceResponse<number[]>;
        }

        const monthlyData = monthlyResult.data || [];

        if (monthlyData.length === 0) {
            return {
                success: false,
                error: "Nenhum dado encontrado para o período",
            };
        }

        // 2. Filtrar meses válidos
        const validMonths = monthlyData.filter((row) => {
            const failureDays = row.null_days + row.zero_days;
            const failurePercentage = (failureDays / row.total_days) * 100;
            return failurePercentage <= config.maxFailurePercentage!;
        });

        if (validMonths.length === 0) {
            return {
                success: false,
                error: `Nenhum mês passou no critério de ${config.maxFailurePercentage}% de falhas (modo mensal)`,
            };
        }

        // 3. Buscar flows dos meses válidos
        const monthConditions = validMonths
            .map((m) => `(strftime('%Y', date) = '${m.year}' AND strftime('%m', date) = '${m.month.padStart(2, "0")}')`)
            .join(" OR ");

        let flowsQuery = `
            SELECT flow_rate
            FROM daily_Streamflows
            WHERE station_id = ?
            AND (${monthConditions})
            AND flow_rate IS NOT NULL 
            AND flow_rate > 0.0
        `;

        if (config.startDate) {
            flowsQuery += ` AND date >= ?`;
        }

        if (config.endDate) {
            flowsQuery += ` AND date <= ?`;
        }

        flowsQuery += ` ORDER BY date ASC`;

        const flowsResult = safeDbQueryAll<{ flow_rate: number }>(
            db,
            flowsQuery,
            params,
            "fetching flows with monthly filter"
        );

        if (!flowsResult.success) {
            return flowsResult as ServiceResponse<number[]>;
        }

        const validFlows = (flowsResult.data || []).map((row) => row.flow_rate);

        if (validFlows.length === 0) {
            return {
                success: false,
                error: "Nenhuma vazão válida após filtro mensal",
            };
        }

        return {
            success: true,
            data: validFlows,
        };
    } catch (error) {
        return {
            success: false,
            error: `Erro no filtro mensal: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Aplica filtro ANUAL de falhas
 */
function getValidFlowsAnnuallyFiltered(db: Database.Database, config: PreprocessingConfig): ServiceResponse<number[]> {
    try {
        // 1. Analisar anos
        let annualQuery = `
            SELECT 
                strftime('%Y', date) as year,
                COUNT(*) as total_days,
                SUM(CASE WHEN flow_rate IS NULL THEN 1 ELSE 0 END) as null_days,
                SUM(CASE WHEN flow_rate = 0.0 THEN 1 ELSE 0 END) as zero_days
            FROM daily_Streamflows
            WHERE station_id = ?
        `;

        const params: any[] = [config.stationId];

        if (config.startDate) {
            annualQuery += ` AND date >= ?`;
            params.push(config.startDate);
        }

        if (config.endDate) {
            annualQuery += ` AND date <= ?`;
            params.push(config.endDate);
        }

        annualQuery += `
            GROUP BY strftime('%Y', date)
            ORDER BY year
        `;

        const annualResult = safeDbQueryAll<{
            year: string;
            total_days: number;
            null_days: number;
            zero_days: number;
        }>(db, annualQuery, params, "analyzing years");

        if (!annualResult.success) {
            return annualResult as ServiceResponse<number[]>;
        }

        const annualData = annualResult.data || [];

        if (annualData.length === 0) {
            return {
                success: false,
                error: "Nenhum dado encontrado para o período",
            };
        }

        // 2. Filtrar anos válidos
        const validYears = annualData.filter((row) => {
            const failureDays = row.null_days + row.zero_days;
            const failurePercentage = (failureDays / row.total_days) * 100;
            return failurePercentage <= config.maxFailurePercentage!;
        });

        if (validYears.length === 0) {
            return {
                success: false,
                error: `Nenhum ano passou no critério de ${config.maxFailurePercentage}% de falhas (modo anual)`,
            };
        }

        // 3. Buscar flows dos anos válidos
        const yearConditions = validYears.map((y) => `strftime('%Y', date) = '${y.year}'`).join(" OR ");

        let flowsQuery = `
            SELECT flow_rate
            FROM daily_Streamflows
            WHERE station_id = ?
            AND (${yearConditions})
            AND flow_rate IS NOT NULL 
            AND flow_rate > 0.0
        `;

        if (config.startDate) {
            flowsQuery += ` AND date >= ?`;
        }

        if (config.endDate) {
            flowsQuery += ` AND date <= ?`;
        }

        flowsQuery += ` ORDER BY date ASC`;

        const flowsResult = safeDbQueryAll<{ flow_rate: number }>(
            db,
            flowsQuery,
            params,
            "fetching flows with annual filter"
        );

        if (!flowsResult.success) {
            return flowsResult as ServiceResponse<number[]>;
        }

        const validFlows = (flowsResult.data || []).map((row) => row.flow_rate);

        if (validFlows.length === 0) {
            return {
                success: false,
                error: "Nenhuma vazão válida após filtro anual",
            };
        }

        return {
            success: true,
            data: validFlows,
        };
    } catch (error) {
        return {
            success: false,
            error: `Erro no filtro anual: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}
