// src/backend/services/preprocessing.service.ts

import Database from "better-sqlite3";
import { safeDbQueryAll } from "../utils/db.util";
import { PreprocessingConfig, ServiceResponse } from "../types/preprocessing.types";

interface MonthAnalysis {
    year: number;
    month: number;
    monthName: string;
    totalDays: number;
    validDays: number;
    nullDays: number;
    zeroDays: number;
    failureDays: number;
    failurePercentage: number;
    isIncluded: boolean;
    reason?: string;
}

interface YearAnalysis {
    year: number;
    totalDays: number;
    validDays: number;
    nullDays: number;
    zeroDays: number;
    failureDays: number;
    failurePercentage: number;
    isIncluded: boolean;
    reason?: string;
}

interface PreprocessingAnalysisResult {
    config: PreprocessingConfig;
    analysis: {
        mode: string;
        period: { start: string; end: string };
        totalPeriods: number;
        includedPeriods: number;
        excludedPeriods: number;
        totalValidFlows: number;
        overallCompleteness: number;
    };
    monthsTable?: MonthAnalysis[];
    yearsTable?: YearAnalysis[];
}

export class PreprocessingService {
    private db: Database.Database;

    constructor(database: Database.Database) {
        this.db = database;
    }

    private getMonthName(month: number): string {
        const months = [
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
        ];
        return months[month - 1] || `Mês ${month}`;
    }

    /**
     * Analisa dados para visualização (não executa cálculos)
     */
    analyzeForVisualization(config: PreprocessingConfig): ServiceResponse<PreprocessingAnalysisResult> {
        if (config.mode === "none") {
            return {
                success: false,
                error: "Modo 'none' não requer análise de pré-processamento",
            };
        }

        if (config.mode === "monthly") {
            return this.analyzeMonthly(config);
        } else if (config.mode === "annually") {
            return this.analyzeAnnually(config);
        }

        return {
            success: false,
            error: `Modo inválido: ${config.mode}`,
        };
    }

    private analyzeMonthly(config: PreprocessingConfig): ServiceResponse<PreprocessingAnalysisResult> {
        try {
            // 1. Buscar e analisar dados mensais
            let query = `
            SELECT 
                strftime('%Y', date) as year,
                strftime('%m', date) as month,
                COUNT(*) as total_days,
                SUM(CASE WHEN flow_rate IS NULL THEN 1 ELSE 0 END) as null_days,
                SUM(CASE WHEN flow_rate = 0.0 THEN 1 ELSE 0 END) as zero_days,
                SUM(CASE WHEN flow_rate IS NOT NULL AND flow_rate > 0.0 THEN 1 ELSE 0 END) as valid_days
            FROM daily_Streamflows
            WHERE station_id = ?
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

            query += `
            GROUP BY strftime('%Y', date), strftime('%m', date)
            ORDER BY year, month
        `;

            const result = safeDbQueryAll<{
                year: string;
                month: string;
                total_days: number;
                null_days: number;
                zero_days: number;
                valid_days: number;
            }>(this.db, query, params, "analyzing monthly data for preprocessing");

            if (!result.success || !result.data) {
                return result as ServiceResponse<PreprocessingAnalysisResult>;
            }

            const monthlyData = result.data;

            if (monthlyData.length === 0) {
                return {
                    success: false,
                    error: "Nenhum dado encontrado para o período selecionado",
                };
            }

            // 2. Processar análise de cada mês
            const monthsTable: MonthAnalysis[] = monthlyData.map((row) => {
                const year = parseInt(row.year);
                const month = parseInt(row.month);
                const totalDays = row.total_days;
                const nullDays = row.null_days;
                const zeroDays = row.zero_days;
                const validDays = row.valid_days;
                const failureDays = nullDays + zeroDays;
                const failurePercentage = (failureDays / totalDays) * 100;
                const isIncluded = failurePercentage <= config.maxFailurePercentage!;

                let reason: string | undefined;
                if (!isIncluded) {
                    reason = `Excedeu o limite de ${config.maxFailurePercentage}% de falhas (${failurePercentage.toFixed(1)}%)`;
                }

                return {
                    year,
                    month,
                    monthName: this.getMonthName(month),
                    totalDays,
                    validDays,
                    nullDays,
                    zeroDays,
                    failureDays,
                    failurePercentage: parseFloat(failurePercentage.toFixed(2)),
                    isIncluded,
                    reason,
                };
            });

            // 3. Calcular estatísticas gerais
            const includedMonths = monthsTable.filter((m) => m.isIncluded);

            if (includedMonths.length === 0) {
                return {
                    success: false,
                    error: `Nenhum mês passou no critério de ${config.maxFailurePercentage}% de falhas máximas`,
                };
            }

            const totalValidFlows = includedMonths.reduce((sum, m) => sum + m.validDays, 0);
            const totalPossibleDays = includedMonths.reduce((sum, m) => sum + m.totalDays, 0);
            const overallCompleteness = totalPossibleDays > 0 ? (totalValidFlows / totalPossibleDays) * 100 : 0;

            // 4. Montar resultado
            return {
                success: true,
                data: {
                    config,
                    analysis: {
                        mode: "monthly",
                        period: {
                            start:
                                config.startDate ||
                                `${monthsTable[0].year}-${String(monthsTable[0].month).padStart(2, "0")}-01`,
                            end:
                                config.endDate ||
                                `${monthsTable[monthsTable.length - 1].year}-${String(monthsTable[monthsTable.length - 1].month).padStart(2, "0")}-01`,
                        },
                        totalPeriods: monthsTable.length,
                        includedPeriods: includedMonths.length,
                        excludedPeriods: monthsTable.length - includedMonths.length,
                        totalValidFlows,
                        overallCompleteness: parseFloat(overallCompleteness.toFixed(2)),
                    },
                    monthsTable,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro na análise mensal: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }

    private analyzeAnnually(config: PreprocessingConfig): ServiceResponse<PreprocessingAnalysisResult> {
        try {
            // Analisar anos
            let query = `
                SELECT 
                    strftime('%Y', date) as year,
                    COUNT(*) as total_days,
                    SUM(CASE WHEN flow_rate IS NULL THEN 1 ELSE 0 END) as null_days,
                    SUM(CASE WHEN flow_rate = 0.0 THEN 1 ELSE 0 END) as zero_days,
                    SUM(CASE WHEN flow_rate IS NOT NULL AND flow_rate > 0.0 THEN 1 ELSE 0 END) as valid_days
                FROM daily_Streamflows
                WHERE station_id = ?
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

            query += ` GROUP BY year ORDER BY year`;

            const result = safeDbQueryAll<{
                year: string;
                total_days: number;
                null_days: number;
                zero_days: number;
                valid_days: number;
            }>(this.db, query, params, "analyzing years");

            if (!result.success || !result.data) {
                return result as ServiceResponse<PreprocessingAnalysisResult>;
            }

            const yearsTable: YearAnalysis[] = result.data.map((row) => {
                const year = parseInt(row.year);
                const failureDays = row.null_days + row.zero_days;
                const failurePercentage = (failureDays / row.total_days) * 100;
                const isIncluded = failurePercentage <= config.maxFailurePercentage!;

                return {
                    year,
                    totalDays: row.total_days,
                    validDays: row.valid_days,
                    nullDays: row.null_days,
                    zeroDays: row.zero_days,
                    failureDays,
                    failurePercentage: parseFloat(failurePercentage.toFixed(2)),
                    isIncluded,
                    reason: !isIncluded
                        ? `Excedeu ${config.maxFailurePercentage}% (${failurePercentage.toFixed(1)}%)`
                        : undefined,
                };
            });

            const includedYears = yearsTable.filter((y) => y.isIncluded);
            const totalValidFlows = includedYears.reduce((sum, y) => sum + y.validDays, 0);
            const totalDays = includedYears.reduce((sum, y) => sum + y.totalDays, 0);

            return {
                success: true,
                data: {
                    config,
                    analysis: {
                        mode: "annually",
                        period: {
                            start: config.startDate || `${yearsTable[0].year}-01-01`,
                            end: config.endDate || `${yearsTable[yearsTable.length - 1].year}-12-31`,
                        },
                        totalPeriods: yearsTable.length,
                        includedPeriods: includedYears.length,
                        excludedPeriods: yearsTable.length - includedYears.length,
                        totalValidFlows,
                        overallCompleteness: totalDays > 0 ? (totalValidFlows / totalDays) * 100 : 0,
                    },
                    yearsTable,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: `Erro na análise anual: ${error instanceof Error ? error.message : String(error)}`,
            };
        }
    }
}
