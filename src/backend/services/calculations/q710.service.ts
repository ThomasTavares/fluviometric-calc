import Database from "better-sqlite3";
import { safeDbQueryAll } from "../../utils/db.util";
import { getValidFlowsWithPreprocessing } from "../../utils/preprocessing.util";
import { PreprocessingConfig, PreprocessingOptions, ServiceResponse } from "../../types/preprocessing.types";

interface DistributionResult {
    distribution: string;
    n_events: number;
    ic_upper_95: number;
    event_m3s: number;
    ic_lower_95: number;
    ic_amplitude: number;
    std_error: number;
    mean: number;
    variance: number;
    skewness: number;
    alpha: number;
    beta: number;
    gamma: number;
    A: number;
    k_factor: number;
    xi?: number;
}

interface ReturnPeriodPoint {
    return_period: number; // T (anos)
    flow_rate: number; // Q (m³/s)
    ic_lower: number;
    ic_upper: number;
}

interface Q710Result {
    station_id: string;
    start_date: string;
    end_date: string;
    n_years: number;
    n_zeros: number;
    q7_values: number[];
    best_distribution: DistributionResult;
    all_distributions: DistributionResult[];
    return_period_curves: {
        [distributionName: string]: ReturnPeriodPoint[];
    };
    method_reference: string;
    notes: string;
}

interface DateRange {
    startDate?: string;
    endDate?: string;
    yearType?: "calendar" | "hydrological";
    hydroStartMonth?: number;
    windowSize?: number;
}

export class Q710Service {
    private db: Database.Database;

    constructor(database: Database.Database) {
        this.db = database;
    }

    /*
	Gera notas informativas sobre o cálculo Q7,10
	- Identifica a melhor distribuição (menor intervalo de confiança)
	- Valida qualidade da série (>= 15 anos recomendado, >= 30 anos ideal)
	- Alerta sobre assimetria fora da faixa [-1.02, 2.00]
	- Informa presença de vazões zero
	
	Exemplo de saída:
	"Melhor distribuição: Log-Pearson III (menor IC); Série: 25 anos (hidrológico, início mês 10); 
		Assimetria γ=-1.250 fora da faixa recomendada [-1.02, 2.00]; ✓ Série longa (≥ 30 anos)"
    */
    private generateNotes(
        best: DistributionResult,
        n: number,
        n_zeros: number,
        yearType: string,
        hydroStartMonth: number
    ): string {
        const notes: string[] = [];

        notes.push(`Melhor distribuição: ${best.distribution} (menor IC)`);
        notes.push(
            `Série: ${n} anos (${yearType === "hydrological" ? `hidrológico, início mês ${hydroStartMonth}` : "calendário"})`
        );

        if (n_zeros > 0) {
            notes.push(`⚠️ ${n_zeros} dias com vazão zero (ignorados nos cálculos)`);
        }

        const gamma = best.skewness;
        if (gamma < -1.02 || gamma > 2.0) {
            notes.push(`⚠️ Assimetria γ=${gamma.toFixed(3)} fora da faixa recomendada [-1.02, 2.00]`);
        }

        if (n < 15) {
            notes.push(`⚠️ Série curta (< 15 anos). Resultados menos confiáveis`);
        } else if (n >= 30) {
            notes.push(`✓ Série longa (≥ 30 anos). Boa confiabilidade`);
        }

        return notes.join("; ");
    }

    /*
    Calcula vazão (Q) para um período de retorno específico usando diferentes distribuições

    Fórmulas por distribuição:

    1. Normal: Q = μ + k·σ
    onde k = z_p (quantil normal padrão)
    s_m = (σ/√n)·√(1 + k²/2)

    2. Log-Normal: ln(Q) = μ_ln + k·σ_ln
    Q = exp(μ_ln + k·σ_ln)
    s_m = (σ_ln/√n)·√(1 + k²/2)

    3. Pearson III: Q = μ + k·σ
    k = (2/γ)·[(1 + γ·z_p/6 - (γ²/36)·(z_p² - 1))³ - 1]
    s_m = (σ/√n)·√(1 + k²/(2α))

    4. Log-Pearson III: ln(Q) = μ_ln + k·σ_ln
    Q = exp(ln(Q))
    k calculado com γ da série logarítmica

    5. Weibull: Q = λ·[-ln(1-p)]^(1/k)
    onde λ = scale, k = shape

    Retorna: { q, ic_lower, ic_upper } com IC de 95% (±1.96·s_m)

    Exemplo: T=10 anos → p=0.1 → Q7,10 = 2.5 m³/s (IC: 2.1 - 2.9)
    */
    private calculateQForReturnPeriod(
        dist: DistributionResult,
        p: number,
        T: number
    ): { q: number; ic_lower: number; ic_upper: number } {
        const n = dist.n_events;

        // Recalcular estatísticas base (você precisará armazenar os valores originais)
        // Por simplicidade, vamos usar os parâmetros já calculados da distribuição
        let q: number;
        let s_m: number;

        switch (dist.distribution) {
            case "Normal": {
                const z_p = this.normalQuantile(p);
                const k = z_p;
                q = dist.mean + k * Math.sqrt(dist.variance);
                s_m = (Math.sqrt(dist.variance) / Math.sqrt(n)) * Math.sqrt(1 + (k * k) / 2);
                break;
            }

            case "Log-Normal": {
                const z_p = this.normalQuantile(p);
                const k = z_p;
                const log_mean = Math.log(dist.mean); // Aproximação
                const log_std = Math.sqrt(Math.log(1 + dist.variance / (dist.mean * dist.mean)));
                const log_q = log_mean + k * log_std;
                q = Math.exp(log_q);
                s_m = (log_std / Math.sqrt(n)) * Math.sqrt(1 + (k * k) / 2);
                break;
            }

            case "Pearson III": {
                const z_p = this.normalQuantile(p);
                const k = this.calculateKFactor(z_p, dist.gamma);
                q = dist.mean + k * Math.sqrt(dist.variance);
                s_m = (Math.sqrt(dist.variance) / Math.sqrt(n)) * Math.sqrt(1 + (k * k) / (2 * dist.alpha));
                break;
            }

            case "Log-Pearson III": {
                const z_p = this.normalQuantile(p);
                const k = this.calculateKFactor(z_p, dist.gamma);
                // Usar os parâmetros já calculados
                const log_q = dist.mean + k * Math.sqrt(dist.variance); // mean já é ln
                q = Math.exp(log_q);
                s_m = (Math.sqrt(dist.variance) / Math.sqrt(n)) * Math.sqrt(1 + (k * k) / (2 * dist.alpha));
                break;
            }

            case "Weibull": {
                const shape = dist.alpha; // shape
                const scale = dist.beta; // scale
                q = scale * Math.pow(-Math.log(1 - p), 1 / shape);
                const k_approx = (q - dist.mean) / Math.sqrt(dist.variance);
                s_m = (Math.sqrt(dist.variance) / Math.sqrt(n)) * Math.sqrt(1 + (k_approx * k_approx) / 2);
                break;
            }

            default:
                q = dist.event_m3s;
                s_m = dist.std_error;
        }

        const ic_lower = q - 1.96 * s_m;
        const ic_upper = q + 1.96 * s_m;

        return { q, ic_lower, ic_upper };
    }

    /*
	Gera curvas completas de período de retorno para todas as distribuições testadas
	
	Calcula vazões para T = [2, 5, 10, 15, 20, 25, 30, 50, 75, 100] anos
	Para cada T: p = 1/T (ex: T=10 → p=0.1)
	
	Retorna objeto com estrutura:
	{
	"Normal": [
		{ return_period: 2, flow_rate: 5.2, ic_lower: 4.8, ic_upper: 5.6 },
		{ return_period: 10, flow_rate: 2.5, ic_lower: 2.1, ic_upper: 2.9 },
		...
	],
	"Log-Pearson III": [...],
	...
	}
	
	Útil para plotar curvas de frequência e comparar distribuições visualmente
    */
    generateReturnPeriodCurves(distributions: DistributionResult[]): {
        [distributionName: string]: ReturnPeriodPoint[];
    } {
        const curves: { [distributionName: string]: ReturnPeriodPoint[] } = {};

        // Períodos de retorno de 2 a 100 anos (cobertura completa)
        const returnPeriods = [2, 5, 10, 15, 20, 25, 30, 50, 75, 100];

        distributions.forEach((dist) => {
            const points: ReturnPeriodPoint[] = [];

            returnPeriods.forEach((T) => {
                const p = 1 / T; // Probabilidade de não-excedência

                // Calcular Q para cada período de retorno
                const { q, ic_lower, ic_upper } = this.calculateQForReturnPeriod(dist, p, T);

                points.push({
                    return_period: T,
                    flow_rate: Number(q.toFixed(4)),
                    ic_lower: Number(ic_lower.toFixed(4)),
                    ic_upper: Number(ic_upper.toFixed(4)),
                });
            });

            curves[dist.distribution] = points;
        });

        return curves;
    }

    /*
	Busca série temporal completa de vazões diárias do banco de dados
	
	Processo:
	1. Query: SELECT date, flow_rate WHERE station_id = ? AND flow_rate IS NOT NULL
	2. Aplica filtros de data (startDate, endDate) se fornecidos
	3. Preenche gaps entre primeira e última data (cria série contínua)
	4. Conta vazões zero (são válidas, mas importantes para análise)
	
	Retorna:
	- series: Array com { date, flow, isValid }
	- n_zeros: Quantidade de dias com vazão = 0
	- startDate/endDate: Período efetivo dos dados
	
	Exemplo de série:
	[
	    { date: "2010-01-01", flow: 5.2, isValid: true },
	    { date: "2010-01-02", flow: null, isValid: false }, // gap
	    { date: "2010-01-03", flow: 0, isValid: true }, // zero válido
	]
    */
    private getCompleteTimeSeries(
        stationId: string,
        dateRange?: DateRange,
        preprocessingOptions?: PreprocessingOptions // Mudou para Options
    ): ServiceResponse<{
        series: { date: string; flow: number | null; isValid: boolean }[];
        n_zeros: number;
        startDate: string;
        endDate: string;
    }> {
        // Se tem pré-processamento, usa a utility
        if (preprocessingOptions && preprocessingOptions.mode && preprocessingOptions.mode !== "none") {
            // Monta config COMPLETA (com stationId)
            const config: PreprocessingConfig = {
                stationId,
                startDate: dateRange?.startDate,
                endDate: dateRange?.endDate,
                mode: preprocessingOptions.mode,
                maxFailurePercentage: preprocessingOptions.maxFailurePercentage,
            };

            const validFlowsResult = getValidFlowsWithPreprocessing(this.db, config);

            if (!validFlowsResult.success || !validFlowsResult.data) {
                return {
                    success: false,
                    error: validFlowsResult.error || "No valid flows found",
                };
            }

            // Buscar datas correspondentes aos flows válidos
            let queryDates = `
                SELECT date, flow_rate as flow
                FROM daily_streamflows
                WHERE station_id = ?
                AND flow_rate IS NOT NULL
                AND flow_rate > 0
            `;

            const paramsDate: any[] = [stationId];

            if (dateRange?.startDate) {
                queryDates += ` AND date >= ?`;
                paramsDate.push(dateRange.startDate);
            }

            if (dateRange?.endDate) {
                queryDates += ` AND date <= ?`;
                paramsDate.push(dateRange.endDate);
            }

            queryDates += ` ORDER BY date ASC`;

            const resultDates = safeDbQueryAll<{ date: string; flow: number }>(
                this.db,
                queryDates,
                paramsDate,
                "fetching dates for Q7,10 with preprocessing"
            );

            if (!resultDates.success || !resultDates.data || resultDates.data.length === 0) {
                return { success: false, error: "No valid flow data found" };
            }

            const data = resultDates.data;
            const startDate = data[0].date;
            const endDate = data[data.length - 1].date;
            const n_zeros = data.filter((d) => d.flow === 0).length;

            // Criar série completa
            const start = new Date(startDate);
            const end = new Date(endDate);
            const dataMap = new Map(data.map((d) => [d.date, d.flow]));

            const completeSeries: { date: string; flow: number | null; isValid: boolean }[] = [];
            const currentDate = new Date(start);

            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split("T")[0];
                const flow = dataMap.get(dateStr);

                completeSeries.push({
                    date: dateStr,
                    flow: flow !== undefined ? flow : null,
                    isValid: flow !== undefined && flow !== null,
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }

            return {
                success: true,
                data: { series: completeSeries, n_zeros, startDate, endDate },
            };
        }

        // COMPORTAMENTO PADRÃO/LEGACY
        let query = `
            SELECT date, flow_rate as flow
            FROM daily_streamflows
            WHERE station_id = ?
            AND flow_rate IS NOT NULL
        `;

        const params: any[] = [stationId];

        if (dateRange?.startDate) {
            query += ` AND date >= ?`;
            params.push(dateRange.startDate);
        }

        if (dateRange?.endDate) {
            query += ` AND date <= ?`;
            params.push(dateRange.endDate);
        }

        query += ` ORDER BY date ASC`;

        const result = safeDbQueryAll<{ date: string; flow: number }>(
            this.db,
            query,
            params,
            "fetching daily flows for Q7,10"
        );

        if (!result.success || !result.data || result.data.length === 0) {
            return { success: false, error: "No valid flow data found" };
        }

        const data = result.data;
        const startDate = data[0].date;
        const endDate = data[data.length - 1].date;
        const n_zeros = data.filter((d) => d.flow === 0).length;

        // Criar série completa
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dataMap = new Map(data.map((d) => [d.date, d.flow]));

        const completeSeries: { date: string; flow: number | null; isValid: boolean }[] = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split("T")[0];
            const flow = dataMap.get(dateStr);

            completeSeries.push({
                date: dateStr,
                flow: flow !== undefined ? flow : null,
                isValid: flow !== undefined && flow !== null,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
            success: true,
            data: { series: completeSeries, n_zeros, startDate, endDate },
        };
    }

    /*
    Calcula médias móveis de 7 dias consecutivos (Q7)

    Algoritmo:
    1. Percorre série com janela deslizante de tamanho = windowSize (default 7)
    2. Para cada janela de 7 dias:
    - Verifica se há gaps (isValid = false) → se sim, pula
    - Calcula média aritmética: Q7 = (Q₁ + Q₂ + ... + Q₇) / 7
    - IMPORTANTE: Divide sempre por 7, mesmo com zeros (zero é vazão válida?)

    Exemplo:
    Janela 1-7/jan: [5.2, 4.8, 3.9, 2.1, 1.8, 0, 0] → Q7 = 2.54 m³/s
    Janela 2-8/jan: [4.8, 3.9, 2.1, 1.8, 0, 0, null] → PULA (tem gap)

    Retorna: Array de { date (início), endDate (fim), q7 (média) }
    Falha se não houver nenhuma janela completa de 7 dias
    */
    private calculateMovingAverages7Days(
        series: { date: string; flow: number | null; isValid: boolean }[],
        windowSize: number = 7
    ): ServiceResponse<{ date: string; q7: number; endDate: string }[]> {
        const movingAvgs: { date: string; q7: number; endDate: string }[] = [];

        for (let i = 0; i <= series.length - windowSize; i++) {
            const window = series.slice(i, i + windowSize);

            const hasGap = window.some((d) => !d.isValid);

            if (hasGap) {
                continue;
            }

            // Incluir zeros no cálculo (vazão zero é válida)
            const flows = window.filter((d) => d.isValid && d.flow !== null).map((d) => d.flow as number);

            // Dividir sempre por windowSize (7), não por flows.length
            if (flows.length === windowSize) {
                const sum = flows.reduce((a, b) => a + b, 0);
                const avg = sum / windowSize;

                movingAvgs.push({
                    date: window[0].date,
                    endDate: window[windowSize - 1].date,
                    q7: avg,
                });
            }
        }

        if (movingAvgs.length === 0) {
            return { success: false, error: "No valid 7-day windows found" };
        }

        return { success: true, data: movingAvgs };
    }

    /*
    Extrai o Q7 mínimo de cada ano (calendário ou hidrológico)

    Ano Calendário: jan-dez (padrão brasileiro)
    Ano Hidrológico: personalizado (ex: out-set para região Sul)

    Lógica:
    1. Para cada Q7 calculado, identifica o ano de pertencimento:
    - Calendário: ano = year(endDate)
    - Hidrológico: se mês < hydroStartMonth → ano = year - 1

    2. Agrupa todos Q7 por ano
    3. Seleciona MIN(Q7) de cada ano → série anual de Q7 mínimos

    Exemplo (ano hidrológico out-set):
    - 15/out/2010: Q7=1.5 → Ano 2010
    - 20/mar/2011: Q7=0.8 → Ano 2010 (mês 3 < 10)
    - 05/dez/2011: Q7=2.1 → Ano 2011

    Retorna: [0.8, 2.1, ...] (Q7 mínimo de cada ano)
    */
    private extractAnnualQ7(
        movingAvgs: { date: string; q7: number; endDate: string }[],
        yearType: "calendar" | "hydrological",
        hydroStartMonth: number
    ): ServiceResponse<number[]> {
        const yearMap = new Map<number, number[]>();

        movingAvgs.forEach(({ endDate, q7 }) => {
            const date = new Date(endDate);
            let year: number;

            if (yearType === "hydrological") {
                const month = date.getMonth() + 1;
                year = date.getFullYear();
                // Se o mês for antes do início do ano hidrológico, pertence ao ano anterior
                if (month < hydroStartMonth) {
                    year = year - 1;
                }
            } else {
                year = date.getFullYear();
            }

            if (!yearMap.has(year)) {
                yearMap.set(year, []);
            }
            yearMap.get(year)!.push(q7);
        });

        // Extrair Q7 mínimo de cada ano
        const q7Annual: number[] = [];
        yearMap.forEach((values, year) => {
            if (values.length > 0) {
                q7Annual.push(Math.min(...values));
            }
        });

        if (q7Annual.length === 0) {
            return { success: false, error: "Could not calculate annual Q7 values" };
        }

        return { success: true, data: q7Annual };
    }

    calculateQ710(
        stationId: string,
        dateRange?: DateRange,
        windowSize: number = 7,
        preprocessingOptions?: PreprocessingOptions // Mudou para Options
    ): ServiceResponse<Q710Result> {
        if (!stationId || stationId.trim() === "") {
            return { success: false, error: "Station ID is required" };
        }

        try {
            const yearType = dateRange?.yearType || "calendar";
            const hydroStartMonth = dateRange?.hydroStartMonth || 1;

            // ETAPA 1: Obter série temporal completa
            const timeSeriesResult = this.getCompleteTimeSeries(
                stationId,
                dateRange,
                preprocessingOptions // Passa Options
            );

            if (!timeSeriesResult.success) {
                return { success: false, error: timeSeriesResult.error };
            }

            const { series, n_zeros, startDate, endDate } = timeSeriesResult.data!;

            if (series.length < 365) {
                return {
                    success: false,
                    error: `Insufficient data. Need at least 1 year. Found ${series.length} days`,
                };
            }

            // ETAPA 2: Calcular médias móveis de 7 dias
            const movingAvgResult = this.calculateMovingAverages7Days(series, windowSize);
            if (!movingAvgResult.success) {
                return { success: false, error: movingAvgResult.error };
            }

            const movingAvgs = movingAvgResult.data!;

            // ETAPA 3: Extrair Q7 anual
            const q7AnnualResult = this.extractAnnualQ7(movingAvgs, yearType, hydroStartMonth);
            if (!q7AnnualResult.success) {
                return { success: false, error: q7AnnualResult.error };
            }

            const q7Values = q7AnnualResult.data!;
            const n = q7Values.length;

            if (n < 10) {
                return {
                    success: false,
                    error: `Insufficient years for Q7,10. Need at least 10 years. Found ${n} years`,
                };
            }

            // ETAPA 4: Testar todas as distribuições
            const T = 10;
            const p = 1 / T;

            const distributions: DistributionResult[] = [
                this.testNormalDistribution(q7Values, p, T),
                this.testLogNormalDistribution(q7Values, p, T),
                this.testPearsonIII(q7Values, p, T),
                this.testLogPearsonIII(q7Values, p, T),
                this.testWeibull(q7Values, p, T),
            ].filter((d) => d !== null) as DistributionResult[];

            if (distributions.length === 0) {
                return { success: false, error: "No valid distributions found" };
            }

            // ETAPA 5: Selecionar melhor distribuição
            const bestDistribution = distributions.reduce((best, current) =>
                current.ic_amplitude < best.ic_amplitude ? current : best
            );

            // ETAPA 6: Gerar notas e curvas
            const notes = this.generateNotes(bestDistribution, n, n_zeros, yearType, hydroStartMonth);
            const returnPeriodCurves = this.generateReturnPeriodCurves(distributions);

            return {
                success: true,
                data: {
                    station_id: stationId,
                    start_date: startDate,
                    end_date: endDate,
                    n_years: n,
                    n_zeros,
                    q7_values: q7Values.map((v) => Number(v.toFixed(4))),
                    best_distribution: bestDistribution,
                    all_distributions: distributions,
                    return_period_curves: returnPeriodCurves,
                    method_reference: "Kite (1988) - metodologia SisCAH/USGS",
                    notes,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Error calculating Q7,10: ${error.message}`,
            };
        }
    }

    /*
    Calcula estatísticas amostrais da série de vazões

    Fórmulas (estimadores não-enviesados):

    1. Média: μ = (Σ xᵢ) / n

    2. Variância: s² = Σ(xᵢ - μ)² / (n-1)

    3. Desvio padrão: s = √s²

    4. Coeficiente de assimetria (skewness):
    γ = [n·Σ(xᵢ - μ)³] / [(n-1)·(n-2)·s³]
    
    Interpretação:
    γ ≈ 0: distribuição simétrica
    γ > 0: assimetria positiva (cauda direita longa)
    γ < 0: assimetria negativa (cauda esquerda longa)

    Exemplo:
    Série: [1.2, 0.8, 1.5, 0.5, 2.1]
    → μ = 1.22, σ = 0.62, γ = 0.45
    */
    private calculateStatistics(values: number[]): {
        mean: number;
        std: number;
        variance: number;
        gamma: number;
        skewness: number;
    } {
        const n = values.length;
        const mean = values.reduce((sum, v) => sum + v, 0) / n;

        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
        const std = Math.sqrt(variance);

        const m3 = values.reduce((sum, v) => sum + Math.pow(v - mean, 3), 0);
        const gamma = (n * m3) / ((n - 1) * (n - 2) * Math.pow(std, 3));

        return {
            mean,
            std,
            variance,
            gamma,
            skewness: gamma,
        };
    }

    /*
	Calcula o quantil da distribuição normal padrão (z_p)
	
	Aproximação de Beasley-Springer-Moro (1977)
	Precisão: erro < 10⁻⁹ para 0.001 < p < 0.999
	
	Retorna z tal que P(Z ≤ z) = p
	
	Para Q7,10: T=10 anos → p=1/10=0.1 → z_p ≈ -1.282
				(quantil inferior, pois buscamos vazões MÍNIMAS)
	
	Algoritmo:
	- Se |p-0.5| < 0.42: aproximação racional para região central
	- Senão: aproximação exponencial para caudas
	
	Exemplos:
	p = 0.5 → z = 0 (mediana)
	p = 0.1 → z ≈ -1.282 (10º percentil)
	p = 0.05 → z ≈ -1.645 (5º percentil)
	p = 0.01 → z ≈ -2.326 (1º percentil)
    */
    private normalQuantile(p: number): number {
        console.log(" [NORMAL-QUANTILE] p recebido =", p);

        if (p <= 0 || p >= 1) {
            throw new Error("Probability must be between 0 and 1");
        }

        const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
        const b = [-8.4735109309, 23.08336743743, -21.06224101826, 3.13082909833];
        const c = [
            0.3374754822726147, 0.9761690190917186, 0.1607979714918209, 0.0276438810333863, 0.0038405729373609,
            0.0003951896511919, 0.0000321767881768, 0.0000002888167364, 0.0000003960315187,
        ];

        const y = p - 0.5;

        if (Math.abs(y) < 0.42) {
            const r = y * y;
            let x = y * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]);
            x = x / ((((b[3] * r + b[2]) * r + b[1]) * r + b[0]) * r + 1);
            return x;
        }

        let r = p;
        if (y > 0) r = 1 - p;
        r = Math.log(-Math.log(r));

        let x = c[0];
        for (let i = 1; i < c.length; i++) {
            x = x * r + c[i];
        }

        if (y < 0) x = -x;

        console.log(" [NORMAL-QUANTILE] z_p calculado =", x);

        return x;
    }

    /*
    Calcula o fator K de frequência usando método de Kite (1988)

    Usado nas distribuições Pearson III e Log-Pearson III

    Fórmula de Kite:
    k = (2/γ)·[(1 + γ·z_p/6 - (γ²/36)·(z_p² - 1))³ - 1]

    onde:
    - γ = coeficiente de assimetria
    - z_p = quantil normal padrão

    Casos especiais:
    - Se γ ≈ 0: k → z_p (converge para distribuição Normal)
    - Se γ > 0: distribuição assimétrica positiva
    - Se γ < 0: distribuição assimétrica negativa

    Aplicação: Q = μ + k·σ

    Exemplo:
    γ = -0.5, z_p = -1.282 (p=0.1)
        → k ≈ -1.45 (mais negativo que z_p devido assimetria negativa)
        → Q7,10 = 5.0 + (-1.45)·2.0 = 2.1 m³/s
    */
    private calculateKFactor(z_p: number, gamma: number): number {
        console.log("\n [K-FACTOR] z_p =", z_p, "| gamma =", gamma);

        const absGamma = Math.abs(gamma);

        if (absGamma < 1e-6) {
            console.log(" [K-FACTOR] Gamma próximo de zero, retornando z_p");
            return z_p;
        }

        const term1 = 1 + (gamma * z_p) / 6;
        const term2 = ((gamma * gamma) / 36) * (z_p * z_p - 1);
        const k = (2 / gamma) * (Math.pow(term1 - term2, 3) - 1);

        console.log(" [K-FACTOR] term1 =", term1, "| term2 =", term2);
        console.log(" [K-FACTOR] k calculado =", k);

        return k;
    }

    /*
    distribuição Normal para série Q7

    Fórmula: Q = μ + k·σ
    onde k = z_p (quantil normal padrão)

    Para p=0.1 (T=10): z_p ≈ -1.282

    Erro padrão (Kite, 1988):
    s_m = (σ/√n)·√(1 + k²/2)

    Intervalo de confiança 95%:
    IC = Q ± 1.96·s_m

    Exemplo:
    μ = 5.0 m³/s, σ = 2.0, n = 25, k = -1.282
        → Q7,10 = 5.0 + (-1.282)·2.0 = 2.44 m³/s
        → s_m = (2.0/√25)·√(1 + 1.644/2) = 0.52
        → IC = [1.42, 3.46]
    */
    private testNormalDistribution(values: number[], p: number, T: number): DistributionResult {
        const stats = this.calculateStatistics(values);
        const n = values.length;
        const z_p = this.normalQuantile(p); // Agora será negativo (p=0.1)
        const k = z_p;

        const q710 = stats.mean + k * stats.std;

        // Erro padrão corrigido (já divide por sqrt(n))
        const s_m = (stats.std / Math.sqrt(n)) * Math.sqrt(1 + (k * k) / 2);
        const ic_lower = q710 - 1.96 * s_m;
        const ic_upper = q710 + 1.96 * s_m;

        return {
            distribution: "Normal",
            n_events: n,
            event_m3s: Number(q710.toFixed(4)),
            ic_lower_95: Number(ic_lower.toFixed(4)),
            ic_upper_95: Number(ic_upper.toFixed(4)),
            ic_amplitude: Number((ic_upper - ic_lower).toFixed(4)),
            std_error: Number(s_m.toFixed(6)),
            mean: Number(stats.mean.toFixed(4)),
            variance: Number(stats.variance.toFixed(4)),
            skewness: Number(stats.gamma.toFixed(4)),
            alpha: 0,
            beta: 0,
            gamma: Number(stats.gamma.toFixed(4)),
            A: Number((ic_upper - ic_lower).toFixed(4)),
            k_factor: Number(k.toFixed(4)),
        };
    }

    /*
    distribuição Log-Normal para série Q7

    Transformação: Y = ln(Q)
    Premissa: Y segue distribuição Normal

    Fórmula: ln(Q) = μ_ln + k·σ_ln
            Q = exp(μ_ln + k·σ_ln)

    onde:
        - μ_ln = média de ln(Q)
        - σ_ln = desvio padrão de ln(Q)
        - k = z_p (quantil normal)

    Intervalo de confiança:
    ln(IC) = ln(Q) ± 1.96·s_m_ln
    IC = exp(ln(IC))

    Exemplo:
    Série original: [5.2, 3.8, 2.1, 1.5, 0.8]
    Série log: [1.649, 1.335, 0.742, 0.405, -0.223]
    μ_ln = 0.782, σ_ln = 0.726
        → ln(Q7,10) = 0.782 + (-1.282)·0.726 = -0.149
        → Q7,10 = exp(-0.149) = 0.86 m³/s
    */
    private testLogNormalDistribution(values: number[], p: number, T: number): DistributionResult | null {
        if (values.some((v) => v <= 0)) {
            return null;
        }

        const logValues = values.map((v) => Math.log(v));
        const logStats = this.calculateStatistics(logValues);

        //Calcular estatísticas da série ORIGINAL para exibição
        const originalStats = this.calculateStatistics(values);

        const n = values.length;
        const z_p = this.normalQuantile(p);
        const k = z_p;

        const log_q710 = logStats.mean + k * logStats.std;
        const q710 = Math.exp(log_q710);

        const s_m_log = (logStats.std / Math.sqrt(n)) * Math.sqrt(1 + (k * k) / 2);
        const log_ic_lower = log_q710 - 1.96 * s_m_log;
        const log_ic_upper = log_q710 + 1.96 * s_m_log;

        const ic_lower = Math.exp(log_ic_lower);
        const ic_upper = Math.exp(log_ic_upper);

        return {
            distribution: "Log-Normal",
            n_events: n,
            event_m3s: Number(q710.toFixed(4)),
            ic_lower_95: Number(ic_lower.toFixed(4)),
            ic_upper_95: Number(ic_upper.toFixed(4)),
            ic_amplitude: Number((ic_upper - ic_lower).toFixed(4)),
            std_error: Number(s_m_log.toFixed(6)),
            mean: Number(originalStats.mean.toFixed(4)),
            variance: Number(originalStats.variance.toFixed(4)),
            skewness: Number(originalStats.skewness.toFixed(6)),
            alpha: 0,
            beta: 0,
            gamma: Number(originalStats.skewness.toFixed(6)),
            A: Number((ic_upper - ic_lower).toFixed(4)),
            k_factor: Number(k.toFixed(6)),
        };
    }

    /*
    distribuição Pearson Tipo III para série Q7

    Distribuição Gama de 3 parâmetros (forma, escala, localização)

    Parametrização SisCAH (Agência Nacional de Águas):
    α = 4/γ² (forma)
    β = (σ·γ)/2 (escala)
    ξ = μ - 2σ/γ (localização)

    Fórmula: Q = μ + k·σ
    onde k = fator de Kite (função de z_p e γ)

    Erro padrão:
    s_m = (σ/√n)·√(1 + k²/(2α))

    Exemplo:
    μ = 5.0, σ = 2.0, γ = -0.8, n = 25
    α = 4/0.64 = 6.25
    β = (2.0·(-0.8))/2 = -0.8
    ξ = 5.0 - 2·2.0/(-0.8) = 10.0
    z_p = -1.282 → k ≈ -1.45
    → Q7,10 = 5.0 + (-1.45)·2.0 = 2.1 m³/s
    */
    private testPearsonIII(values: number[], p: number, T: number): DistributionResult | null {
        const stats = this.calculateStatistics(values);
        const n = values.length;
        const z_p = this.normalQuantile(p);

        //Parametrização do SisCAH
        const alpha = 4 / (stats.gamma * stats.gamma);
        const beta = (stats.std * stats.gamma) / 2;
        const xi = stats.mean - (2 * stats.std) / stats.gamma;

        // Validação mais permissiva
        if (!isFinite(alpha) || !isFinite(beta) || !isFinite(xi)) {
            return null;
        }

        const k = this.calculateKFactor(z_p, stats.gamma);
        const q710 = stats.mean + k * stats.std;

        const s_m = (stats.std / Math.sqrt(n)) * Math.sqrt(1 + (k * k) / (2 * alpha));
        const ic_lower = q710 - 1.96 * s_m;
        const ic_upper = q710 + 1.96 * s_m;

        return {
            distribution: "Pearson III",
            n_events: n,
            event_m3s: Number(q710.toFixed(4)),
            ic_lower_95: Number(ic_lower.toFixed(4)),
            ic_upper_95: Number(ic_upper.toFixed(4)),
            ic_amplitude: Number((ic_upper - ic_lower).toFixed(4)),
            std_error: Number(s_m.toFixed(6)),
            mean: Number(stats.mean.toFixed(4)),
            variance: Number(stats.variance.toFixed(4)),
            skewness: Number(stats.gamma.toFixed(4)),
            alpha: Number(alpha.toFixed(6)),
            beta: Number(beta.toFixed(6)),
            gamma: Number(stats.gamma.toFixed(4)),
            A: Number((ic_upper - ic_lower).toFixed(4)),
            k_factor: Number(k.toFixed(4)),
            xi: Number(xi.toFixed(6)),
        };
    }

    /*
	Log-Pearson Tipo III para série Q7
	
	Combinação: transformação logarítmica + Pearson III
	Distribuição mais usada pelo USGS (U.S. Geological Survey)
	
	Transformação: Y = ln(Q)
	Y segue Pearson III com parâmetros:
	α = 4/γ_ln²
	β = (σ_ln·|γ_ln|)/2
	ξ = μ_ln - α·β
	
	Fórmula: ln(Q) = μ_ln + k·σ_ln
			Q = exp(ln(Q))
	
	onde k = fator de Kite usando γ da série LOGARÍTMICA
	
	Erro padrão:
	s_m_ln = (σ_ln/√n)·√(1 + k²/(2α))
	IC em espaço log: ln(Q) ± 1.96·s_m_ln
	IC final: exp(ln(IC))
	
	Exemplo:
	Série: [5.2, 3.8, 2.1, 1.5, 0.8]
	ln: [1.649, 1.335, 0.742, 0.405, -0.223]
	μ_ln = 0.782, σ_ln = 0.726, γ_ln = -0.35
	k = -1.35
	→ ln(Q7,10) = 0.782 + (-1.35)·0.726 = -0.198
	→ Q7,10 = exp(-0.198) = 0.82 m³/s
    */
    private testLogPearsonIII(values: number[], p: number, T: number): DistributionResult | null {
        if (values.some((v) => v <= 0)) {
            return null;
        }

        const logValues = values.map((v) => Math.log(v));
        const logStats = this.calculateStatistics(logValues);

        const n = values.length;
        const z_p = this.normalQuantile(p);

        const alpha = 4 / (logStats.gamma * logStats.gamma);
        const beta = (logStats.std * Math.abs(logStats.gamma)) / 2;
        const xi = logStats.mean - alpha * beta;

        if (alpha <= 0 || beta <= 0 || !isFinite(alpha) || !isFinite(beta)) {
            return null;
        }

        const k = this.calculateKFactor(z_p, logStats.gamma);
        const log_q710 = logStats.mean + k * logStats.std;
        const q710 = Math.exp(log_q710);

        const s_m_log = (logStats.std / Math.sqrt(n)) * Math.sqrt(1 + (k * k) / (2 * alpha));
        const log_ic_lower = log_q710 - 1.96 * s_m_log;
        const log_ic_upper = log_q710 + 1.96 * s_m_log;

        const ic_lower = Math.exp(log_ic_lower);
        const ic_upper = Math.exp(log_ic_upper);

        return {
            distribution: "Log-Pearson III",
            n_events: n,
            event_m3s: Number(q710.toFixed(4)),
            ic_lower_95: Number(ic_lower.toFixed(4)),
            ic_upper_95: Number(ic_upper.toFixed(4)),
            ic_amplitude: Number((ic_upper - ic_lower).toFixed(4)),
            std_error: Number(s_m_log.toFixed(6)),
            mean: Number(logStats.mean.toFixed(6)),
            variance: Number(logStats.variance.toFixed(6)),
            skewness: Number(logStats.gamma.toFixed(6)),
            alpha: Number(alpha.toFixed(6)),
            beta: Number(beta.toFixed(6)),
            gamma: Number(logStats.gamma.toFixed(6)),
            A: Number((ic_upper - ic_lower).toFixed(4)),
            k_factor: Number(k.toFixed(6)),
            xi: Number(xi.toFixed(6)),
        };
    }

    /*
    distribuição Weibull para série Q7
     
    Distribuição de 2 parâmetros (forma e escala)
    Muito usada em análises de vazões mínimas
    
    Fórmula CDF: F(Q) = 1 - exp[-(Q/λ)^k]
    Quantil: Q = λ·[-ln(1-p)]^(1/k)
    
    Estimação de parâmetros (método dos momentos gráficos):
    1. Posições de plotagem: F_i = i/(n+1)
    2. Linearização: ln(Q) = ln(λ) + (1/k)·ln[-ln(1-F)]
    3. Regressão linear: Y = A + B·X
        onde Y = ln[-ln(1-F)], X = ln(Q)
        → k = B (forma/shape)
        → λ = exp(-A/B) (escala/scale)
    
    Exemplo:
    Série ordenada: [0.8, 1.2, 1.5, 2.1, 3.5]
    Posições: [0.167, 0.333, 0.5, 0.667, 0.833]
    Regressão → k = 1.8, λ = 2.1
    Para p = 0.1:
        → Q7,10 = 2.1·[-ln(0.9)]^(1/1.8) = 0.75 m³/s
    */
    private testWeibull(values: number[], p: number, T: number): DistributionResult | null {
        const n = values.length;
        const sorted = [...values].sort((a, b) => a - b);

        const plottingPos = sorted.map((val, i) => {
            const F = (i + 1) / (n + 1);
            return {
                x: Math.log(val), // ln(Q)
                y: Math.log(-Math.log(1 - F)), // ln(-ln(1-F))
            };
        });

        const meanX = plottingPos.reduce((sum, p) => sum + p.x, 0) / n;
        const meanY = plottingPos.reduce((sum, p) => sum + p.y, 0) / n;

        const Sxy = plottingPos.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);
        const Sxx = plottingPos.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0);

        if (Sxx === 0 || Sxy === 0) {
            return null;
        }

        //CORRETO: Y = A + B*X → B = Sxy/Sxx (regressão tradicional)
        const shape = Sxy / Sxx; //slope correto
        const intercept = meanY - shape * meanX; //A = Ȳ - B*X̄

        //Scale: da equação ln(Q) = A/B + (1/B)*ln(-ln(1-F))
        // → Q = exp(A/B) * [-ln(1-F)]^(1/B)
        // → scale = exp(A/B) onde A é o intercept quando x=0
        const scale = Math.exp(-intercept / shape);

        if (shape <= 0 || scale <= 0 || !isFinite(shape) || !isFinite(scale)) {
            return null;
        }

        // Quantil Weibull
        const q710 = scale * Math.pow(-Math.log(1 - p), 1 / shape);

        // Resto permanece igual...
        const stats = this.calculateStatistics(values);
        const k_approx = (q710 - stats.mean) / stats.std;
        const s_m = (stats.std / Math.sqrt(n)) * Math.sqrt(1 + (k_approx * k_approx) / 2);

        const ic_lower = q710 - 1.96 * s_m;
        const ic_upper = q710 + 1.96 * s_m;

        return {
            distribution: "Weibull",
            n_events: n,
            event_m3s: Number(q710.toFixed(4)),
            ic_lower_95: Number(ic_lower.toFixed(4)),
            ic_upper_95: Number(ic_upper.toFixed(4)),
            ic_amplitude: Number((ic_upper - ic_lower).toFixed(4)),
            std_error: Number(s_m.toFixed(6)),
            mean: Number(stats.mean.toFixed(4)),
            variance: Number(stats.variance.toFixed(4)),
            skewness: Number(stats.gamma.toFixed(4)),
            alpha: Number(shape.toFixed(6)),
            beta: Number(scale.toFixed(6)),
            gamma: Number(stats.gamma.toFixed(4)),
            A: Number((ic_upper - ic_lower).toFixed(4)),
            k_factor: Number(shape.toFixed(6)),
        };
    }
}
