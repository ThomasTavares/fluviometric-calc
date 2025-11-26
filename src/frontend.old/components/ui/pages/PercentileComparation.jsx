import { useState } from "react";
import {
    BackButton,
    StationListButton,
    CompareMethodsButton,
    PrimaryButton,
    CalculatePercentilesButton,
    SecondaryButton,
} from "../buttons/Buttons";

function PercentileComparison({ onBack }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stationId, setStationId] = useState("65295000");
    const [percentile, setPercentile] = useState(95);
    const [selectedMethod, setSelectedMethod] = useState("weibull");
    const [targetValue, setTargetValue] = useState("");
    const [dateRange, setDateRange] = useState({
        startDate: "",
        endDate: "",
    });
    const [curveData, setCurveData] = useState(null);
    const [numberOfPoints, setNumberOfPoints] = useState(100);
    // Buscar estações disponíveis
    const [stations, setStations] = useState([]);
    const [loadingStations, setLoadingStations] = useState(false);

    // TODOS os métodos disponíveis organizados por categoria
    const allMethods = [
        // Métodos RECOMENDADOS para hidrologia (curvas de permanência)
        {
            value: "weibull",
            label: "Weibull (Posição de Plotagem)",
            category: "🌊 Hidrologia",
            description: "p = m/(n+1) - PADRÃO RECOMENDADO para curvas de permanência",
            recommended: true,
            priority: 1,
        },
        {
            value: "cunnane",
            label: "Cunnane",
            category: "🌊 Hidrologia",
            description: "p = (m-0.4)/(n+0.2) - Reduz viés em amostras pequenas",
            recommended: true,
            priority: 2,
        },
        {
            value: "gringorten",
            label: "Gringorten",
            category: "🌊 Hidrologia",
            description: "p = (m-0.44)/(n+0.12) - Preferido para valores extremos (cauda)",
            recommended: true,
            priority: 3,
        },

        // Métodos clássicos
        {
            value: "linear_interpolation",
            label: "Interpolação Linear",
            category: "📊 Clássico",
            description: "p/100 * (n-1) - Método básico de interpolação",
            recommended: false,
        },
        {
            value: "excel_percentile_inc",
            label: "Excel PERCENTILE.INC",
            category: "📊 Clássico",
            description: "Equivalente ao PERCENTIL do Excel (inclusive)",
            recommended: false,
        },
        {
            value: "excel_percentile_exc",
            label: "Excel PERCENTILE.EXC",
            category: "📊 Clássico",
            description: "Excel exclusivo - p/100 * (n+1)",
            recommended: false,
        },
        {
            value: "nearest_rank",
            label: "Nearest Rank",
            category: "📊 Clássico",
            description: "Arredonda para o valor mais próximo",
            recommended: false,
        },
        {
            value: "lower_value",
            label: "Lower Value",
            category: "📊 Clássico",
            description: "Sempre pega o valor inferior (floor)",
            recommended: false,
        },
        {
            value: "higher_value",
            label: "Higher Value",
            category: "📊 Clássico",
            description: "Sempre pega o valor superior (ceil)",
            recommended: false,
        },

        // Hyndman & Fan (9 tipos)
        {
            value: "type1",
            label: "H&F Type 1",
            category: "📈 Hyndman & Fan",
            description: "Inverso da CDF empírica",
            recommended: false,
        },
        {
            value: "type2",
            label: "H&F Type 2",
            category: "📈 Hyndman & Fan",
            description: "Similar ao Type 1 com média",
            recommended: false,
        },
        {
            value: "type3",
            label: "H&F Type 3",
            category: "📈 Hyndman & Fan",
            description: "SAS definition (nearest even)",
            recommended: false,
        },
        {
            value: "type4",
            label: "H&F Type 4",
            category: "📈 Hyndman & Fan",
            description: "Linear interpolation CDF",
            recommended: false,
        },
        {
            value: "type5",
            label: "H&F Type 5",
            category: "📈 Hyndman & Fan",
            description: "Piecewise linear (hidrologia)",
            recommended: false,
        },
        {
            value: "type6",
            label: "H&F Type 6",
            category: "📈 Hyndman & Fan",
            description: "Excel, SPSS, Python default",
            recommended: false,
        },
        {
            value: "type7",
            label: "H&F Type 7",
            category: "📈 Hyndman & Fan",
            description: "R default, S",
            recommended: false,
        },
        {
            value: "type8",
            label: "H&F Type 8",
            category: "📈 Hyndman & Fan",
            description: "Median unbiased",
            recommended: false,
        },
        {
            value: "type9",
            label: "H&F Type 9",
            category: "📈 Hyndman & Fan",
            description: "Normal unbiased",
            recommended: false,
        },
    ];

    const loadStations = async () => {
        setLoadingStations(true);
        const res = await window.backendApi.stations.getAll();
        if (res.success) {
            setStations(res.data);
        }
        setLoadingStations(false);
    };

    // 1. Comparar TODOS os métodos
    const compareAllMethods = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Por favor, insira um ID de estação" });
            return;
        }

        if (percentile < 0 || percentile > 100) {
            setResult({ success: false, error: "O percentil deve estar entre 0 e 100" });
            return;
        }

        setLoading(true);
        const res = await window.backendApi.analysis.compareAllPercentileMethods(stationId.trim(), percentile);
        setResult({ ...res, type: "comparison" });
        setLoading(false);
    };

    // 2. Calcular com método específico
    const calculateWithMethod = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Por favor, insira um ID de estação" });
            return;
        }

        if (percentile < 0 || percentile > 100) {
            setResult({ success: false, error: "O percentil deve estar entre 0 e 100" });
            return;
        }

        setLoading(true);
        const res = await window.backendApi.analysis.calculatePercentileWithMethod(
            stationId.trim(),
            percentile,
            selectedMethod
        );
        setResult({ ...res, type: "single_method", method: selectedMethod });
        setLoading(false);
    };

    // 3. Calcular todos os percentis padrão (Q95-Q50) com Weibull
    const calculateAllPercentiles = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Por favor, insira um ID de estação" });
            return;
        }

        setLoading(true);
        const res = await window.backendApi.analysis.calculateAllPercentiles(stationId.trim());
        setResult({ ...res, type: "all_percentiles" });
        setLoading(false);
    };

    // 4. Calcular curva de permanência (para gráfico)
    const calculateFlowDurationCurve = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Por favor, insira um ID de estação" });
            return;
        }

        setLoading(true);

        const dateRangeParam =
            dateRange.startDate || dateRange.endDate
                ? {
                      startDate: dateRange.startDate || undefined,
                      endDate: dateRange.endDate || undefined,
                  }
                : undefined;

        const res = await window.backendApi.analysis.calculateFlowDurationCurve(
            stationId.trim(),
            dateRangeParam,
            numberOfPoints
        );

        setCurveData(res);
        setResult({ ...res, type: "flow_duration_curve" });
        setLoading(false);
    };

    // Renderiza tabela de comparação COMPLETA
    const renderComparisonTable = (data) => {
        if (!data || !data.methods) return null;

        const methodsData = Object.entries(data.methods).map(([method, value]) => ({
            method,
            value,
            info: allMethods.find((m) => m.value === method) || { label: method, category: "Outro", description: "" },
        }));

        // Ordena por valor
        methodsData.sort((a, b) => a.value - b.value);

        // Estatísticas
        const values = methodsData.map((m) => m.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const range = max - min;

        // Busca o valor mais próximo do target
        const target = parseFloat(targetValue);
        let closestMethod = null;
        let closestDiff = Infinity;

        if (!isNaN(target)) {
            methodsData.forEach((m) => {
                const diff = Math.abs(m.value - target);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestMethod = m;
                }
            });
        }

        // Métodos recomendados
        const recommendedMethods = methodsData.filter((m) => m.info.recommended);

        return (
            <div style={{ marginTop: "20px" }}>
                {/* Resumo */}
                <div style={{ marginBottom: "20px", padding: "20px", background: "#e3f2fd", borderRadius: "8px" }}>
                    <h3 style={{ margin: "0 0 15px 0", color: "#1976D2" }}>
                        📊 Comparação Completa - Q{data.percentile} ({methodsData.length} Métodos)
                    </h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "15px",
                        }}
                    >
                        <div>
                            <strong>Estação:</strong> {data.station_id}
                        </div>
                        <div>
                            <strong>Total de registros:</strong> {data.total_records.toLocaleString("pt-BR")}
                        </div>
                        <div>
                            <strong>Valor mínimo:</strong> {min.toFixed(4)} m³/s
                        </div>
                        <div>
                            <strong>Valor máximo:</strong> {max.toFixed(4)} m³/s
                        </div>
                        <div>
                            <strong>Média dos métodos:</strong> {avg.toFixed(4)} m³/s
                        </div>
                        <div>
                            <strong>Amplitude:</strong> {range.toFixed(4)} m³/s ({((range / avg) * 100).toFixed(2)}%)
                        </div>
                    </div>
                </div>

                {/* Destaque: Métodos Recomendados para Hidrologia */}
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "20px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "8px",
                        color: "white",
                    }}
                >
                    <h3 style={{ margin: "0 0 15px 0" }}>
                        ⭐ Métodos Recomendados para Hidrologia (Curvas de Permanência)
                    </h3>
                    <div style={{ display: "grid", gap: "10px" }}>
                        {recommendedMethods.map(({ method, value, info }) => (
                            <div
                                key={method}
                                style={{
                                    padding: "15px",
                                    background: "rgba(255,255,255,0.15)",
                                    borderRadius: "5px",
                                    backdropFilter: "blur(10px)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <strong style={{ fontSize: "16px" }}>
                                            {info.priority === 1 ? "🥇 " : info.priority === 2 ? "🥈 " : "🥉 "}
                                            {info.label}
                                        </strong>
                                        <div style={{ fontSize: "12px", opacity: 0.9, marginTop: "3px" }}>
                                            {info.description}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "24px",
                                            fontWeight: "bold",
                                            fontFamily: "monospace",
                                            background: "rgba(255,255,255,0.2)",
                                            padding: "10px 20px",
                                            borderRadius: "5px",
                                        }}
                                    >
                                        {value.toFixed(4)} m³/s
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alerta do valor mais próximo do target */}
                {!isNaN(target) && closestMethod && (
                    <div
                        style={{
                            marginBottom: "20px",
                            padding: "20px",
                            background: closestDiff < 0.001 ? "#c8e6c9" : "#fff3e0",
                            borderRadius: "8px",
                            border: `2px solid ${closestDiff < 0.001 ? "#4caf50" : "#ff9800"}`,
                        }}
                    >
                        <h3 style={{ margin: "0 0 10px 0", color: closestDiff < 0.001 ? "#2e7d32" : "#e65100" }}>
                            {closestDiff < 0.001 ? "🎯 VALOR ENCONTRADO!" : "🔍 Valor Mais Próximo do Target"}
                        </h3>
                        <div style={{ fontSize: "16px", lineHeight: "1.8" }}>
                            <div>
                                <strong>Valor buscado:</strong> {target.toFixed(4)} m³/s
                            </div>
                            <div>
                                <strong>Método mais próximo:</strong> {closestMethod.info.label}
                            </div>
                            <div>
                                <strong>Categoria:</strong> {closestMethod.info.category}
                            </div>
                            <div>
                                <strong>Valor calculado:</strong> {closestMethod.value.toFixed(4)} m³/s
                            </div>
                            <div>
                                <strong>Diferença:</strong> {closestDiff.toFixed(4)} m³/s (
                                {((closestDiff / target) * 100).toFixed(3)}%)
                            </div>
                            <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
                                <strong>Descrição:</strong> {closestMethod.info.description}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabela de comparação */}
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Categoria</th>
                            <th style={thStyle}>Método</th>
                            <th style={thStyle}>Q{data.percentile} (m³/s)</th>
                            <th style={thStyle}>Dif. da Média</th>
                            <th style={thStyle}>Dif. %</th>
                            {!isNaN(target) && <th style={thStyle}>Dif. do Target</th>}
                            <th style={thStyle}>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        {methodsData.map(({ method, value, info }) => {
                            const diffFromAvg = value - avg;
                            const diffPercent = ((value - avg) / avg) * 100;
                            const diffFromTarget = !isNaN(target) ? value - target : 0;
                            const isMin = value === min;
                            const isMax = value === max;
                            const isClosest = closestMethod && closestMethod.method === method;
                            const isRecommended = info.recommended;

                            return (
                                <tr
                                    key={method}
                                    style={{
                                        ...trStyle,
                                        background: isClosest
                                            ? "#fff9c4"
                                            : isRecommended
                                              ? "#f3e5f5"
                                              : isMin
                                                ? "#ffebee"
                                                : isMax
                                                  ? "#e8f5e9"
                                                  : "white",
                                        fontWeight: isClosest || isRecommended ? "bold" : "normal",
                                    }}
                                >
                                    <td style={{ ...tdStyle, fontSize: "12px", color: "#666" }}>{info.category}</td>
                                    <td style={{ ...tdStyle, fontWeight: "bold" }}>
                                        {isRecommended && "⭐ "}
                                        {info.label}
                                        {isMin && " 🔻"}
                                        {isMax && " 🔺"}
                                        {isClosest && " 🎯"}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            fontFamily: "monospace",
                                            fontSize: "16px",
                                        }}
                                    >
                                        {value.toFixed(4)}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            fontFamily: "monospace",
                                            fontSize: "13px",
                                            color: diffFromAvg > 0 ? "#2e7d32" : diffFromAvg < 0 ? "#c62828" : "#666",
                                        }}
                                    >
                                        {diffFromAvg > 0 ? "+" : ""}
                                        {diffFromAvg.toFixed(4)}
                                    </td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            fontFamily: "monospace",
                                            fontSize: "13px",
                                            color: diffPercent > 0 ? "#2e7d32" : diffPercent < 0 ? "#c62828" : "#666",
                                        }}
                                    >
                                        {diffPercent > 0 ? "+" : ""}
                                        {diffPercent.toFixed(2)}%
                                    </td>
                                    {!isNaN(target) && (
                                        <td
                                            style={{
                                                ...tdStyle,
                                                textAlign: "right",
                                                fontFamily: "monospace",
                                                fontSize: "13px",
                                                color: Math.abs(diffFromTarget) < 0.01 ? "#2e7d32" : "#666",
                                            }}
                                        >
                                            {diffFromTarget > 0 ? "+" : ""}
                                            {diffFromTarget.toFixed(4)}
                                        </td>
                                    )}
                                    <td style={{ ...tdStyle, fontSize: "12px", color: "#666" }}>{info.description}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Análise */}
                <div style={{ marginTop: "20px", padding: "15px", background: "#fafafa", borderRadius: "5px" }}>
                    <h4 style={{ marginTop: "0" }}>💡 Análise Estatística</h4>
                    <ul style={{ margin: "10px 0", paddingLeft: "20px", lineHeight: "1.8", fontSize: "14px" }}>
                        <li>
                            <strong>Método mais conservador:</strong> {methodsData[0].info.label} (
                            {methodsData[0].value.toFixed(4)} m³/s)
                        </li>
                        <li>
                            <strong>Método menos conservador:</strong> {methodsData[methodsData.length - 1].info.label}{" "}
                            ({methodsData[methodsData.length - 1].value.toFixed(4)} m³/s)
                        </li>
                        <li>
                            <strong>Variação entre métodos:</strong> {range.toFixed(4)} m³/s (
                            {((range / avg) * 100).toFixed(2)}% da média)
                        </li>
                        {range / avg > 0.05 && (
                            <li style={{ color: "#e65100", fontWeight: "bold" }}>
                                ⚠️ Variação significativa (&gt;5%) - Atenção na escolha do método
                            </li>
                        )}
                        <li style={{ color: "#1976d2", fontWeight: "bold" }}>
                            ✅ Métodos recomendados para hidrologia: Weibull, Cunnane, Gringorten
                        </li>
                    </ul>
                </div>
            </div>
        );
    };

    // Renderiza resultado de método único
    const renderSingleMethodResult = (data, method) => {
        if (!data || typeof data.value === "undefined") return null;

        const methodInfo = allMethods.find((m) => m.value === method);
        const isRecommended = methodInfo?.recommended;

        return (
            <div style={{ marginTop: "20px" }}>
                <div
                    style={{
                        padding: "20px",
                        background: isRecommended ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#e8f5e9",
                        borderRadius: "8px",
                        color: isRecommended ? "white" : "#2e7d32",
                    }}
                >
                    <h3 style={{ margin: "0 0 15px 0" }}>
                        {isRecommended ? "⭐ " : "✅ "}Resultado - {methodInfo?.label}
                    </h3>
                    {isRecommended && (
                        <div
                            style={{
                                background: "rgba(255,255,255,0.2)",
                                padding: "10px",
                                borderRadius: "5px",
                                marginBottom: "15px",
                                fontSize: "14px",
                            }}
                        >
                            🌊 <strong>Método Recomendado para Hidrologia</strong>
                        </div>
                    )}
                    <div style={{ fontSize: "14px", opacity: isRecommended ? 0.9 : 1, marginBottom: "15px" }}>
                        <strong>Categoria:</strong> {methodInfo?.category} | {methodInfo?.description}
                    </div>
                    <div style={{ display: "flex", gap: "30px", alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "5px" }}>Percentil</div>
                            <div style={{ fontSize: "32px", fontWeight: "bold" }}>Q{data.percentile}</div>
                        </div>
                        <div style={{ fontSize: "48px", opacity: 0.5 }}>→</div>
                        <div>
                            <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "5px" }}>Vazão Calculada</div>
                            <div style={{ fontSize: "32px", fontWeight: "bold", fontFamily: "monospace" }}>
                                {data.value.toFixed(4)} m³/s
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        marginTop: "15px",
                        padding: "15px",
                        background: "#f5f5f5",
                        borderRadius: "5px",
                        fontSize: "14px",
                        color: "#555",
                    }}
                >
                    <strong>Interpretação (Curva de Permanência):</strong> Esta vazão é igualada ou superada em{" "}
                    {data.percentile}% do tempo. Apenas {100 - data.percentile}% do tempo a vazão é menor que este
                    valor.
                </div>
            </div>
        );
    };

    // Renderiza todos os percentis padrão
    const renderAllPercentilesTable = (data) => {
        if (!data || !data.percentiles) return null;

        return (
            <div style={{ marginTop: "20px" }}>
                <div
                    style={{
                        marginBottom: "15px",
                        padding: "20px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "8px",
                        color: "white",
                    }}
                >
                    <h3 style={{ margin: "0 0 10px 0" }}>📊 Estação: {data.station_id}</h3>
                    <p style={{ margin: "0", opacity: 0.9 }}>
                        <strong>Total de registros válidos:</strong> {data.total_records.toLocaleString("pt-BR")}
                    </p>
                    <p style={{ margin: "10px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
                        ⭐ Calculado usando: <strong>Método Weibull (Padrão para Hidrologia)</strong>
                    </p>
                </div>

                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Percentil</th>
                            <th style={thStyle}>Vazão (m³/s)</th>
                            <th style={thStyle}>Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(data.percentiles).map(([key, value]) => (
                            <tr key={key} style={trStyle}>
                                <td style={tdStyle}>
                                    <strong>{key}</strong>
                                </td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontFamily: "monospace",
                                        fontSize: "16px",
                                    }}
                                >
                                    {value.toFixed(4)}
                                </td>
                                <td style={{ ...tdStyle, fontSize: "13px", color: "#666" }}>
                                    {getPercentileDescription(key)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const getPercentileDescription = (percentile) => {
        const descriptions = {
            Q95: "Vazão mínima - Extremamente baixa (95% do tempo é maior)",
            Q90: "Vazão muito baixa - Referência para outorga (90% do tempo é maior)",
            Q85: "Vazão baixa (85% do tempo é maior)",
            Q80: "Vazão moderadamente baixa (80% do tempo é maior)",
            Q75: "Primeiro quartil (75% do tempo é maior)",
            Q70: "Vazão abaixo da média (70% do tempo é maior)",
            Q65: "Vazão ligeiramente abaixo da média",
            Q60: "Vazão próxima à média",
            Q55: "Vazão ligeiramente acima da média",
            Q50: "Mediana - Vazão central (50% acima, 50% abaixo)",
        };
        return descriptions[percentile] || "Sem descrição";
    };

    // Renderiza o gráfico da curva de permanência
    const renderFlowDurationCurve = (data) => {
        if (!data || !data.curve_points || data.curve_points.length === 0) return null;

        const points = data.curve_points;

        // Dimensões do gráfico
        const width = 1000;
        const height = 600;
        const marginTop = 60;
        const marginRight = 80;
        const marginBottom = 80;
        const marginLeft = 80;
        const chartWidth = width - marginLeft - marginRight;
        const chartHeight = height - marginTop - marginBottom;

        // Escalas
        const maxFlow = Math.max(...points.map((p) => p.flow_rate));
        const minFlow = Math.min(...points.map((p) => p.flow_rate));
        const flowRange = maxFlow - minFlow;

        // Função para converter valor em coordenada Y (invertido porque SVG começa do topo)
        const yScale = (flow) => {
            return marginTop + chartHeight - ((flow - minFlow) / flowRange) * chartHeight;
        };

        // Função para converter percentil em coordenada X
        const xScale = (percentile) => {
            return marginLeft + (percentile / 100) * chartWidth;
        };

        // Gerar pontos da linha
        const pathData = points
            .map((point, i) => {
                const x = xScale(point.percentile);
                const y = yScale(point.flow_rate);
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

        // Marcadores Q95, Q90, Q50
        const markers = [
            { percentile: 95, label: "Q95", color: "#c62828" },
            { percentile: 90, label: "Q90", color: "#d84315" },
            { percentile: 75, label: "Q75", color: "#f57c00" },
            { percentile: 50, label: "Q50 (Mediana)", color: "#388e3c" },
        ];

        // Encontrar valores para os marcadores
        const markerValues = markers.map((m) => {
            const point =
                points.find((p) => Math.abs(p.percentile - m.percentile) < 0.5) ||
                points.reduce((prev, curr) =>
                    Math.abs(curr.percentile - m.percentile) < Math.abs(prev.percentile - m.percentile) ? curr : prev
                );
            return { ...m, value: point.flow_rate, point };
        });

        // Grid lines (horizontais)
        const gridLines = 10;
        const gridSteps = [];
        for (let i = 0; i <= gridLines; i++) {
            const flow = minFlow + (flowRange / gridLines) * i;
            gridSteps.push(flow);
        }

        return (
            <div style={{ marginTop: "20px" }}>
                {/* Informações */}
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "20px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "8px",
                        color: "white",
                    }}
                >
                    <h3 style={{ margin: "0 0 15px 0" }}>📊 Curva de Permanência - Estação {data.station_id}</h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "15px",
                            fontSize: "14px",
                        }}
                    >
                        <div>
                            <strong>Total de registros:</strong> {data.total_records.toLocaleString("pt-BR")}
                        </div>
                        <div>
                            <strong>Número de pontos:</strong> {points.length}
                        </div>
                        {data.date_range && (
                            <>
                                <div>
                                    <strong>Data inicial:</strong>{" "}
                                    {data.date_range.start_date !== "N/A"
                                        ? data.date_range.start_date
                                        : "Início dos dados"}
                                </div>
                                <div>
                                    <strong>Data final:</strong>{" "}
                                    {data.date_range.end_date !== "N/A" ? data.date_range.end_date : "Fim dos dados"}
                                </div>
                            </>
                        )}
                        <div>
                            <strong>Vazão máxima:</strong> {maxFlow.toFixed(2)} m³/s
                        </div>
                        <div>
                            <strong>Vazão mínima:</strong> {minFlow.toFixed(2)} m³/s
                        </div>
                    </div>
                </div>

                {/* Legenda dos marcadores */}
                <div
                    style={{
                        marginBottom: "15px",
                        padding: "15px",
                        background: "#f5f5f5",
                        borderRadius: "5px",
                        display: "flex",
                        gap: "20px",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <strong>Marcadores:</strong>
                    {markerValues.map((m) => (
                        <div key={m.percentile} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                                style={{
                                    width: "16px",
                                    height: "16px",
                                    background: m.color,
                                    borderRadius: "50%",
                                }}
                            ></div>
                            <span style={{ fontSize: "13px" }}>
                                <strong>{m.label}:</strong> {m.value.toFixed(2)} m³/s
                            </span>
                        </div>
                    ))}
                </div>

                {/* Gráfico SVG */}
                <div
                    style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        overflowX: "auto",
                    }}
                >
                    <svg width={width} height={height} style={{ display: "block", margin: "0 auto" }}>
                        {/* Grid lines horizontais */}
                        {gridSteps.map((flow, i) => (
                            <g key={`grid-${i}`}>
                                <line
                                    x1={marginLeft}
                                    y1={yScale(flow)}
                                    x2={width - marginRight}
                                    y2={yScale(flow)}
                                    stroke="#e0e0e0"
                                    strokeWidth="1"
                                />
                                <text
                                    x={marginLeft - 10}
                                    y={yScale(flow)}
                                    textAnchor="end"
                                    alignmentBaseline="middle"
                                    fontSize="12"
                                    fill="#666"
                                >
                                    {flow.toFixed(1)}
                                </text>
                            </g>
                        ))}

                        {/* Grid lines verticais (percentis) */}
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((percentile) => (
                            <g key={`vgrid-${percentile}`}>
                                <line
                                    x1={xScale(percentile)}
                                    y1={marginTop}
                                    x2={xScale(percentile)}
                                    y2={height - marginBottom}
                                    stroke="#e0e0e0"
                                    strokeWidth="1"
                                />
                                <text
                                    x={xScale(percentile)}
                                    y={height - marginBottom + 20}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#666"
                                >
                                    {percentile}%
                                </text>
                            </g>
                        ))}

                        {/* Eixos */}
                        <line
                            x1={marginLeft}
                            y1={height - marginBottom}
                            x2={width - marginRight}
                            y2={height - marginBottom}
                            stroke="#333"
                            strokeWidth="2"
                        />
                        <line
                            x1={marginLeft}
                            y1={marginTop}
                            x2={marginLeft}
                            y2={height - marginBottom}
                            stroke="#333"
                            strokeWidth="2"
                        />

                        {/* Labels dos eixos */}
                        <text
                            x={marginLeft + chartWidth / 2}
                            y={height - 20}
                            textAnchor="middle"
                            fontSize="16"
                            fontWeight="bold"
                            fill="#333"
                        >
                            Percentil (%) - Frequência de Permanência
                        </text>
                        <text
                            x={20}
                            y={marginTop + chartHeight / 2}
                            textAnchor="middle"
                            fontSize="16"
                            fontWeight="bold"
                            fill="#333"
                            transform={`rotate(-90, 20, ${marginTop + chartHeight / 2})`}
                        >
                            Vazão (m³/s)
                        </text>

                        {/* Título */}
                        <text x={width / 2} y={30} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1976D2">
                            Curva de Permanência - Método Weibull
                        </text>

                        {/* Curva principal */}
                        <path
                            d={pathData}
                            fill="none"
                            stroke="#1976D2"
                            strokeWidth="3"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />

                        {/* Área sob a curva (opcional) */}
                        <path
                            d={`${pathData} L ${width - marginRight} ${height - marginBottom} L ${marginLeft} ${height - marginBottom} Z`}
                            fill="rgba(25, 118, 210, 0.1)"
                            stroke="none"
                        />

                        {/* Marcadores Q95, Q90, Q75, Q50 */}
                        {markerValues.map((m) => {
                            const x = xScale(m.point.percentile);
                            const y = yScale(m.point.flow_rate);
                            return (
                                <g key={m.percentile}>
                                    {/* Linha vertical */}
                                    <line
                                        x1={x}
                                        y1={y}
                                        x2={x}
                                        y2={height - marginBottom}
                                        stroke={m.color}
                                        strokeWidth="2"
                                        strokeDasharray="5,5"
                                        opacity="0.6"
                                    />
                                    {/* Ponto */}
                                    <circle cx={x} cy={y} r="6" fill={m.color} stroke="white" strokeWidth="2" />
                                    {/* Label */}
                                    <text
                                        x={x}
                                        y={y - 15}
                                        textAnchor="middle"
                                        fontSize="12"
                                        fontWeight="bold"
                                        fill={m.color}
                                    >
                                        {m.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Tabela de valores dos marcadores */}
                <div style={{ marginTop: "20px" }}>
                    <h4>📌 Valores de Referência</h4>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Marcador</th>
                                <th style={thStyle}>Percentil</th>
                                <th style={thStyle}>Vazão (m³/s)</th>
                                <th style={thStyle}>Frequência de Superação</th>
                                <th style={thStyle}>Descrição</th>
                            </tr>
                        </thead>
                        <tbody>
                            {markerValues.map((m) => (
                                <tr key={m.percentile} style={trStyle}>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div
                                                style={{
                                                    width: "12px",
                                                    height: "12px",
                                                    background: m.color,
                                                    borderRadius: "50%",
                                                }}
                                            ></div>
                                            <strong>{m.label}</strong>
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "center" }}>{m.percentile}%</td>
                                    <td
                                        style={{
                                            ...tdStyle,
                                            textAlign: "right",
                                            fontFamily: "monospace",
                                            fontSize: "16px",
                                        }}
                                    >
                                        {m.value.toFixed(4)}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "center" }}>{100 - m.percentile}%</td>
                                    <td style={{ ...tdStyle, fontSize: "13px", color: "#666" }}>
                                        {getPercentileDescription(`Q${m.percentile}`)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Interpretação */}
                <div
                    style={{
                        marginTop: "20px",
                        padding: "15px",
                        background: "#e3f2fd",
                        borderRadius: "5px",
                    }}
                >
                    <h4 style={{ marginTop: "0", color: "#1976D2" }}>💡 Como Interpretar a Curva</h4>
                    <ul style={{ margin: "10px 0", paddingLeft: "20px", lineHeight: "1.8", fontSize: "14px" }}>
                        <li>
                            <strong>Eixo X (Percentil):</strong> Representa a frequência com que a vazão é igualada ou
                            superada
                        </li>
                        <li>
                            <strong>Eixo Y (Vazão):</strong> Valor da vazão em m³/s
                        </li>
                        <li>
                            <strong>Q95 (Vazão Mínima):</strong> Vazão igualada ou superada em 95% do tempo. Apenas 5%
                            do tempo a vazão é menor.
                        </li>
                        <li>
                            <strong>Q50 (Mediana):</strong> Vazão igualada ou superada em 50% do tempo. Metade dos
                            valores está acima, metade abaixo.
                        </li>
                        <li>
                            <strong>Curva descendente:</strong> Mostra que vazões mais altas ocorrem com menor
                            frequência
                        </li>
                        <li style={{ color: "#c62828", fontWeight: "bold" }}>
                            <strong>Q95 e Q90:</strong> Usados como referência para outorga de água e garantia hídrica
                        </li>
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: "30px", fontFamily: "Arial", maxWidth: "1800px", margin: "0 auto" }}>
            <BackButton onBack={onBack} />

            <h1 style={{ color: "#1976D2", borderBottom: "3px solid #1976D2", paddingBottom: "10px" }}>
                🌊 Sistema de Análise Hidrológica - Curvas de Permanência
            </h1>

            <div
                style={{
                    marginBottom: "20px",
                    padding: "15px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "8px",
                    color: "white",
                }}
            >
                <h3 style={{ margin: "0 0 10px 0" }}>⭐ Métodos Recomendados para Hidrologia</h3>
                <p style={{ margin: "0", fontSize: "14px", opacity: 0.9 }}>
                    Este sistema utiliza <strong>Weibull, Cunnane e Gringorten</strong> como métodos padrão para cálculo
                    de curvas de permanência, conforme as melhores práticas em hidrologia.
                </p>
            </div>

            {/* Configurações Gerais */}
            <div style={{ marginBottom: "30px", padding: "20px", background: "#f5f5f5", borderRadius: "8px" }}>
                <h3 style={{ marginTop: "0" }}>🎯 Configurações</h3>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "15px",
                        marginBottom: "15px",
                    }}
                >
                    <div>
                        <label style={labelStyle}>ID da Estação:</label>
                        <input
                            type="text"
                            value={stationId}
                            onChange={(e) => setStationId(e.target.value)}
                            placeholder="Digite o ID (ex: 65295000)"
                            style={{ ...inputStyle, fontSize: "16px" }}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Percentil (0-100):</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={percentile}
                            onChange={(e) => setPercentile(parseFloat(e.target.value))}
                            style={{ ...inputStyle, fontSize: "16px" }}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Valor Target (opcional):</label>
                        <input
                            type="text"
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                            placeholder="Ex: 11.4250"
                            style={{ ...inputStyle, fontSize: "16px" }}
                        />
                        <small style={{ color: "#666", fontSize: "11px" }}>Para encontrar o método mais próximo</small>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <StationListButton onClick={loadStations} loading={loadingStations} />
                    </div>
                </div>

                {stations.length > 0 && (
                    <div>
                        <label style={labelStyle}>Ou selecione uma estação:</label>
                        <select
                            onChange={(e) => setStationId(e.target.value)}
                            value={stationId}
                            style={{ ...inputStyle, fontSize: "14px" }}
                        >
                            <option value="">Selecione uma estação</option>
                            {stations.map((station) => (
                                <option key={station.id} value={station.id}>
                                    {station.id} - {station.name} ({station.river_name})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Opção 1: Comparar TODOS os métodos */}
            <div style={{ marginBottom: "30px", padding: "20px", background: "#e3f2fd", borderRadius: "8px" }}>
                <h3 style={{ marginTop: "0", color: "#1976D2" }}>🔍 Opção 1: Comparar TODOS os Métodos</h3>
                <p style={{ color: "#555", marginBottom: "15px" }}>
                    Calcula o Q{percentile} usando <strong>todos os métodos disponíveis</strong> e compara os
                    resultados:
                </p>
                <ul style={{ marginBottom: "15px", color: "#555", fontSize: "14px" }}>
                    <li>
                        <strong>3 métodos recomendados:</strong> Weibull ⭐, Cunnane, Gringorten (para hidrologia)
                    </li>
                    <li>
                        <strong>6 métodos clássicos:</strong> Linear, Excel INC/EXC, Nearest, Lower, Higher
                    </li>
                    <li>
                        <strong>9 métodos Hyndman & Fan:</strong> Tipos 1-9 (usados em R, Python, SAS, SPSS)
                    </li>
                </ul>

                <CompareMethodsButton onClick={compareAllMethods} loading={loading} percentile={percentile} />
            </div>

            {/* Opção 2: Método Específico */}
            <div style={{ marginBottom: "30px", padding: "20px", background: "#f3e5f5", borderRadius: "8px" }}>
                <h3 style={{ marginTop: "0", color: "#7b1fa2" }}>📌 Opção 2: Calcular com Método Específico</h3>
                <p style={{ color: "#555", marginBottom: "15px" }}>
                    Escolha um método específico para calcular o Q{percentile}.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "15px", alignItems: "flex-end" }}>
                    <div>
                        <label style={labelStyle}>Método de Cálculo:</label>
                        <select
                            value={selectedMethod}
                            onChange={(e) => setSelectedMethod(e.target.value)}
                            style={{ ...inputStyle, fontSize: "14px" }}
                        >
                            {/* Métodos Recomendados primeiro */}
                            <optgroup label="⭐ RECOMENDADOS PARA HIDROLOGIA">
                                {allMethods
                                    .filter((m) => m.recommended)
                                    .map((method) => (
                                        <option key={method.value} value={method.value}>
                                            {method.label}
                                        </option>
                                    ))}
                            </optgroup>

                            {/* Métodos Clássicos */}
                            <optgroup label="📊 MÉTODOS CLÁSSICOS">
                                {allMethods
                                    .filter((m) => m.category === "📊 Clássico")
                                    .map((method) => (
                                        <option key={method.value} value={method.value}>
                                            {method.label}
                                        </option>
                                    ))}
                            </optgroup>

                            {/* Hyndman & Fan */}
                            <optgroup label="📈 HYNDMAN & FAN">
                                {allMethods
                                    .filter((m) => m.category === "📈 Hyndman & Fan")
                                    .map((method) => (
                                        <option key={method.value} value={method.value}>
                                            {method.label}
                                        </option>
                                    ))}
                            </optgroup>
                        </select>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                            {allMethods.find((m) => m.value === selectedMethod)?.description}
                        </div>
                    </div>

                    <PrimaryButton onClick={calculateWithMethod} disabled={loading}>
                        Calcular Q{percentile}
                    </PrimaryButton>
                </div>
            </div>

            {/* Opção 3: Todos os Percentis Padrão */}
            <div style={{ marginBottom: "30px", padding: "20px", background: "#fff3e0", borderRadius: "8px" }}>
                <h3 style={{ marginTop: "0", color: "#e65100" }}>⭐ Opção 3: Todos os Percentis Padrão (Q95 a Q50)</h3>
                <p style={{ color: "#555", marginBottom: "15px" }}>
                    Calcula de uma vez: <strong>Q95, Q90, Q85, Q80, Q75, Q70, Q65, Q60, Q55, Q50</strong>
                    <br />
                    <small>
                        Usa o método <strong>Weibull</strong> (recomendado para hidrologia)
                    </small>
                </p>

                <CalculatePercentilesButton onClick={calculateAllPercentiles} loading={loading} />
            </div>
            {/* Opção 4: Curva de Permanência (Gráfico) */}
            <div style={{ marginBottom: "30px", padding: "20px", background: "#e8f5e9", borderRadius: "8px" }}>
                <h3 style={{ marginTop: "0", color: "#2e7d32" }}>📈 Opção 4: Curva de Permanência (Gráfico)</h3>
                <p style={{ color: "#555", marginBottom: "15px" }}>
                    Gera o gráfico completo da curva de permanência com marcadores Q95, Q90, Q75 e Q50.
                    <br />
                    <small>Opcionalmente, filtre por período de datas.</small>
                </p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "15px",
                        marginBottom: "15px",
                    }}
                >
                    <div>
                        <label style={labelStyle}>Data Inicial (opcional):</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Data Final (opcional):</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Número de Pontos:</label>
                        <input
                            type="number"
                            min="10"
                            max="500"
                            value={numberOfPoints}
                            onChange={(e) => setNumberOfPoints(parseInt(e.target.value))}
                            style={inputStyle}
                        />
                        <small style={{ color: "#666", fontSize: "11px" }}>
                            Quanto mais pontos, mais suave a curva (10-500)
                        </small>
                    </div>
                </div>

                {(dateRange.startDate || dateRange.endDate) && (
                    <div
                        style={{
                            marginBottom: "15px",
                            padding: "10px",
                            background: "#fff3e0",
                            borderRadius: "5px",
                            fontSize: "13px",
                            color: "#e65100",
                        }}
                    >
                        <strong>📅 Filtro ativo:</strong>
                        {dateRange.startDate && ` De ${dateRange.startDate}`}
                        {dateRange.endDate && ` Até ${dateRange.endDate}`}
                        <SecondaryButton
                            onClick={() => setDateRange({ startDate: "", endDate: "" })}
                            size="small"
                            style={{
                                marginLeft: "15px",
                                background: "#ff9800",
                            }}
                        >
                            Limpar filtro
                        </SecondaryButton>
                    </div>
                )}

                <PrimaryButton
                    onClick={calculateFlowDurationCurve}
                    disabled={loading}
                    style={{ background: "#4CAF50", fontSize: "16px" }}
                >
                    📊 Gerar Curva de Permanência
                </PrimaryButton>
            </div>

            {/* Loading */}
            {loading && (
                <div
                    style={{
                        padding: "30px",
                        textAlign: "center",
                        fontSize: "18px",
                        color: "#666",
                        background: "#f5f5f5",
                        borderRadius: "8px",
                    }}
                >
                    <div style={{ fontSize: "48px", marginBottom: "10px" }}>⏳</div>
                    Processando cálculos com múltiplos métodos...
                </div>
            )}

            {/* Resultados */}
            {result && !loading && (
                <div style={{ marginTop: "30px" }}>
                    <h2 style={{ color: result.success ? "#2e7d32" : "#c62828" }}>
                        {result.success ? "✅ Resultados" : "❌ Erro"}
                    </h2>

                    {!result.success && result.error && (
                        <div style={{ padding: "20px", background: "#ffebee", borderRadius: "8px", color: "#c62828" }}>
                            <strong>Erro:</strong> {result.error}
                        </div>
                    )}

                    {result.success && result.type === "comparison" && renderComparisonTable(result.data)}
                    {result.success &&
                        result.type === "single_method" &&
                        renderSingleMethodResult(result.data, result.method)}
                    {result.success && result.type === "all_percentiles" && renderAllPercentilesTable(result.data)}
                    {result.success && result.type === "flow_duration_curve" && renderFlowDurationCurve(result.data)}
                    {/* JSON completo para debug */}
                    <details style={{ marginTop: "30px" }}>
                        <summary
                            style={{
                                cursor: "pointer",
                                fontWeight: "bold",
                                color: "#1976D2",
                                padding: "10px",
                                background: "#f5f5f5",
                                borderRadius: "5px",
                            }}
                        >
                            📄 Ver JSON completo da resposta
                        </summary>
                        <pre
                            style={{
                                background: "#f4f4f4",
                                padding: "20px",
                                borderRadius: "5px",
                                overflow: "auto",
                                maxHeight: "500px",
                                fontSize: "12px",
                                border: "1px solid #ddd",
                                marginTop: "10px",
                            }}
                        >
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </details>
                </div>
            )}

            {/* Info sobre os métodos */}
            <div
                style={{
                    marginTop: "40px",
                    padding: "20px",
                    background: "#fafafa",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                }}
            >
                <h3 style={{ marginTop: "0" }}>📚 Sobre os Métodos Disponíveis</h3>

                {/* Métodos Recomendados */}
                <div style={{ marginBottom: "25px" }}>
                    <h4 style={{ color: "#7b1fa2", marginBottom: "10px" }}>
                        ⭐ Métodos Recomendados para Hidrologia (3)
                    </h4>
                    <p style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
                        Estes são os métodos mais apropriados para cálculo de <strong>curvas de permanência</strong>{" "}
                        (Q95, Q90, Q85, etc.) em estudos hidrológicos, baseados em posições de plotagem empíricas.
                    </p>
                    <div style={{ display: "grid", gap: "10px" }}>
                        {allMethods
                            .filter((m) => m.recommended)
                            .map((method) => (
                                <div
                                    key={method.value}
                                    style={{
                                        padding: "15px",
                                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        borderRadius: "5px",
                                        color: "white",
                                    }}
                                >
                                    <strong style={{ fontSize: "15px" }}>
                                        {method.priority === 1 ? "🥇 " : method.priority === 2 ? "🥈 " : "🥉 "}
                                        {method.label}
                                        {method.priority === 1 ? " (PADRÃO)" : ""}
                                    </strong>
                                    <p style={{ margin: "5px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                                        {method.description}
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Métodos Clássicos */}
                <div style={{ marginBottom: "25px" }}>
                    <h4 style={{ color: "#1976D2", marginBottom: "10px" }}>📊 Métodos Clássicos (6)</h4>
                    <p style={{ fontSize: "13px", color: "#666", marginBottom: "10px" }}>
                        Métodos tradicionais de cálculo de percentis, amplamente utilizados em estatística geral.
                    </p>
                    <div style={{ display: "grid", gap: "10px" }}>
                        {allMethods
                            .filter((m) => m.category === "📊 Clássico")
                            .map((method) => (
                                <div
                                    key={method.value}
                                    style={{
                                        padding: "12px",
                                        background: "white",
                                        borderRadius: "5px",
                                        border: "1px solid #e0e0e0",
                                    }}
                                >
                                    <strong style={{ color: "#1976D2" }}>{method.label}</strong>
                                    <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>
                                        {method.description}
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Hyndman & Fan */}
                <div>
                    <h4 style={{ color: "#9c27b0", marginBottom: "10px" }}>📈 Hyndman & Fan Types (9)</h4>
                    <p style={{ fontSize: "13px", color: "#666", marginBottom: "10px" }}>
                        Métodos estatísticos padronizados, definidos por Hyndman & Fan (1996). Usados por R, Python
                        (numpy/pandas), SAS, SPSS e outros softwares estatísticos.
                    </p>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                            gap: "10px",
                        }}
                    >
                        {allMethods
                            .filter((m) => m.category === "📈 Hyndman & Fan")
                            .map((method) => (
                                <div
                                    key={method.value}
                                    style={{
                                        padding: "10px",
                                        background: "white",
                                        borderRadius: "5px",
                                        border: "1px solid #e0e0e0",
                                    }}
                                >
                                    <strong style={{ color: "#9c27b0", fontSize: "13px" }}>{method.label}</strong>
                                    <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#666" }}>
                                        {method.description}
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>

                <div style={{ marginTop: "20px", padding: "15px", background: "#e3f2fd", borderRadius: "5px" }}>
                    <h4 style={{ marginTop: "0" }}>💡 Como Usar</h4>
                    <ol style={{ margin: "10px 0", paddingLeft: "20px", lineHeight: "1.8", fontSize: "14px" }}>
                        <li>Digite o ID da estação e o percentil desejado (ex: Q95)</li>
                        <li>
                            <strong>Para curvas de permanência: use Weibull (padrão recomendado)</strong>
                        </li>
                        <li>Se souber o valor esperado, digite no campo "Valor Target"</li>
                        <li>Clique em "Comparar TODOS os Métodos" para análise completa</li>
                        <li>O sistema destacará qual método fica mais próximo do target (🎯)</li>
                        <li>Métodos recomendados são marcados com ⭐</li>
                    </ol>
                </div>

                <div style={{ marginTop: "15px", padding: "15px", background: "#fff3e0", borderRadius: "5px" }}>
                    <h4 style={{ marginTop: "0", color: "#e65100" }}>⚠️ Importante</h4>
                    <ul style={{ margin: "10px 0", paddingLeft: "20px", lineHeight: "1.8", fontSize: "14px" }}>
                        <li>
                            <strong>Para estudos hidrológicos:</strong> Use Weibull, Cunnane ou Gringorten
                        </li>
                        <li>
                            <strong>Weibull</strong> é o padrão recomendado por organismos como ANA e literatura técnica
                        </li>
                        <li>
                            <strong>Cunnane</strong> é preferido quando há amostras pequenas (reduz viés)
                        </li>
                        <li>
                            <strong>Gringorten</strong> é melhor para valores extremos (Q99, Q95)
                        </li>
                        <li>
                            Os outros métodos são úteis para <strong>comparação e validação</strong>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Rodapé */}
            <div
                style={{
                    marginTop: "30px",
                    padding: "20px",
                    background: "#f5f5f5",
                    borderRadius: "8px",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "13px",
                }}
            >
                <p style={{ margin: "0" }}>
                    🌊 Sistema de Análise Hidrológica | Dados: ANA (Agência Nacional de Águas e Saneamento Básico) |
                    Métodos baseados em literatura técnica hidrológica
                </p>
            </div>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
    boxSizing: "border-box",
};

const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    fontSize: "13px",
    color: "#333",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    background: "white",
    borderRadius: "8px",
    overflow: "hidden",
};

const thStyle = {
    background: "#1976D2",
    color: "white",
    padding: "12px 10px",
    textAlign: "left",
    fontWeight: "bold",
    fontSize: "12px",
};

const tdStyle = {
    padding: "10px",
    borderBottom: "1px solid #e0e0e0",
    fontSize: "13px",
};

const trStyle = {
    transition: "background 0.2s",
};

export default PercentileComparison;
