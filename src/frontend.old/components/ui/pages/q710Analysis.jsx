import { useState, useEffect } from "react";

function Q710Analysis({ onBack }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const stationId = sessionStorage.getItem("stationId");
    const startDate = sessionStorage.getItem("startDate");
    const endDate = sessionStorage.getItem("endDate");

    if (!stationId || stationId === "temp") {
        return (
            <div
                style={{
                    padding: "20px",
                    background: "#fff3e0",
                    marginTop: "20px",
                }}
            >
                <div style={{ marginTop: "0", }}>⚠️ Station ID is missing</div>
                <div
                    style={{
                        fontSize: "14px",
                        lineHeight: "1.6",
                        marginTop: "15px",
                    }}
                >
                    Esta estação não possui dados fluviométricos no banco de dados. Você pode sincronizar dados através
                    do menu "Sincronizar Dados".
                </div>
            </div>
        );
    }

    const dateRange = startDate && endDate ? { startDate, endDate } : { startDate: "", endDate: "" };

    // Estados para gráficos
    const [selectedDistributions, setSelectedDistributions] = useState(["Log-Pearson III"]);
    const [showDistributionChart, setShowDistributionChart] = useState(false);

    // Calcular Q7,10
    const calculateQ710 = async () => {
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

        const res = await window.backendApi.analysis.calculateQ710(stationId.trim(), dateRangeParam);

        setResult(res);
        setLoading(false);

        if (res.success) {
            setShowDistributionChart(true);
            // Seleciona automaticamente a melhor distribuição
            setSelectedDistributions([res.data.best_distribution.distribution]);
        }
    };

    // Toggle de seleção de distribuições
    const toggleDistribution = (distName) => {
        setSelectedDistributions((prev) => {
            if (prev.includes(distName)) {
                return prev.filter((d) => d !== distName);
            } else {
                return [...prev, distName];
            }
        });
    };

    // Renderiza informações principais
    const renderMainInfo = (data) => {
        const isGammaValid = data.best_distribution.skewness >= -1.02 && data.best_distribution.skewness <= 2.0;

        return (
            <div style={{ marginTop: "20px" }}>
                {/* Card Principal */}
                <div
                    style={{
                        padding: "25px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "12px",
                        color: "white",
                        marginBottom: "20px",
                    }}
                >
                    <h2 style={{ margin: "0 0 20px 0", fontSize: "28px" }}>
                        💧 Resultado Q7,10 - Estação {data.station_id}
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "20px",
                            marginBottom: "20px",
                        }}
                    >
                        <div
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                padding: "15px",
                                borderRadius: "8px",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "5px" }}>Vazão Q7,10</div>
                            <div style={{ fontSize: "32px", fontWeight: "bold", fontFamily: "monospace" }}>
                                {data.best_distribution.event_m3s} m³/s
                            </div>
                        </div>

                        <div
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                padding: "15px",
                                borderRadius: "8px",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "5px" }}>
                                Distribuição Selecionada
                            </div>
                            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                                {data.best_distribution.distribution}
                            </div>
                            <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "5px" }}>
                                (menor amplitude de IC)
                            </div>
                        </div>

                        <div
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                padding: "15px",
                                borderRadius: "8px",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "5px" }}>
                                Intervalo de Confiança 95%
                            </div>
                            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                                [{data.best_distribution.ic_lower_95}, {data.best_distribution.ic_upper_95}]
                            </div>
                            <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "5px" }}>
                                Amplitude: {data.best_distribution.ic_amplitude.toFixed(4)} m³/s
                            </div>
                        </div>

                        <div
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                padding: "15px",
                                borderRadius: "8px",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "5px" }}>Série Temporal</div>
                            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{data.n_years} anos</div>
                            <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "5px" }}>
                                {data.n_years >= 30
                                    ? "✓ Boa representatividade"
                                    : data.n_years >= 15
                                      ? "Adequado"
                                      : "⚠️ Série curta"}
                            </div>
                        </div>
                    </div>

                    {/* Data Range se houver filtro */}
                    <div
                        style={{
                            background: "rgba(255,255,255,0.2)",
                            padding: "12px",
                            borderRadius: "5px",
                            fontSize: "14px",
                        }}
                    >
                        <strong>📅 Período analisado:</strong> {data.start_date} até {data.end_date}
                        {data.n_zeros > 0 && (
                            <span style={{ marginLeft: "15px", color: "#ffeb3b" }}>
                                ⚠️ {data.n_zeros} dias com vazão zero (ignorados nos cálculos)
                            </span>
                        )}
                    </div>
                </div>

                {/* Estatísticas Amostrais */}
                <div
                    style={{
                        background: "#f5f5f5",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                    }}
                >
                    <h3 style={{ marginTop: "0", color: "#1976D2" }}>📊 Estatísticas da Série Q7</h3>

                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Estatística</th>
                                <th style={thStyle}>Símbolo</th>
                                <th style={thStyle}>Valor</th>
                                <th style={thStyle}>Interpretação</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={trStyle}>
                                <td style={tdStyle}>
                                    <strong>Média</strong>
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "serif", fontSize: "18px" }}>µ</td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontFamily: "monospace",
                                        fontSize: "16px",
                                    }}
                                >
                                    {data.best_distribution.mean} m³/s
                                </td>
                                <td style={{ ...tdStyle, fontSize: "13px", color: "#666" }}>
                                    Valor médio das mínimas anuais de 7 dias
                                </td>
                            </tr>

                            <tr style={trStyle}>
                                <td style={tdStyle}>
                                    <strong>Desvio Padrão</strong>
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "serif", fontSize: "18px" }}>σ</td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontFamily: "monospace",
                                        fontSize: "16px",
                                    }}
                                >
                                    {data.best_distribution.variance
                                        ? Math.sqrt(data.best_distribution.variance).toFixed(4)
                                        : "N/A"}
                                    m³/s
                                </td>
                                <td style={{ ...tdStyle, fontSize: "13px", color: "#666" }}>
                                    Dispersão dos dados em torno da média
                                </td>
                            </tr>

                            <tr style={{ ...trStyle, background: isGammaValid ? "#e8f5e9" : "#ffebee" }}>
                                <td style={tdStyle}>
                                    <strong>Coef. Assimetria</strong>
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "serif", fontSize: "18px" }}>γ</td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontFamily: "monospace",
                                        fontSize: "16px",
                                    }}
                                >
                                    {data.best_distribution.skewness}
                                </td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        fontSize: "13px",
                                        color: isGammaValid ? "#2e7d32" : "#c62828",
                                    }}
                                >
                                    {isGammaValid
                                        ? "✓ Dentro da faixa válida [-1.02, 2.00]"
                                        : "⚠️ FORA da faixa válida"}
                                </td>
                            </tr>

                            <tr style={trStyle}>
                                <td style={tdStyle}>
                                    <strong>Parâmetro α (shape)</strong>
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "serif", fontSize: "18px" }}>α</td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontFamily: "monospace",
                                        fontSize: "16px",
                                    }}
                                >
                                    {data.best_distribution.alpha || "N/A"}
                                </td>
                                <td style={{ ...tdStyle, fontSize: "13px", color: "#666" }}>
                                    Forma da distribuição (α = 4/γ²)
                                </td>
                            </tr>

                            <tr style={trStyle}>
                                <td style={tdStyle}>
                                    <strong>Parâmetro β (scale)</strong>
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "serif", fontSize: "18px" }}>β</td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontFamily: "monospace",
                                        fontSize: "16px",
                                    }}
                                >
                                    {data.best_distribution.beta || "N/A"}
                                </td>
                                <td style={{ ...tdStyle, fontSize: "13px", color: "#666" }}>
                                    Escala da distribuição (β = σ|γ|/2)
                                </td>
                            </tr>

                            <tr style={trStyle}>
                                <td style={tdStyle}>
                                    <strong>Parâmetro γ (gamma)</strong>
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "serif", fontSize: "18px" }}>γ</td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontFamily: "monospace",
                                        fontSize: "16px",
                                    }}
                                >
                                    {data.best_distribution.gamma || "N/A"}
                                </td>
                                <td style={{ ...tdStyle, fontSize: "13px", color: "#666" }}>
                                    Coeficiente de assimetria da distribuição
                                </td>
                            </tr>

                            <tr style={trStyle}>
                                <td style={tdStyle}>
                                    <strong>Parâmetro A</strong>
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "serif", fontSize: "18px" }}>A</td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontFamily: "monospace",
                                        fontSize: "16px",
                                    }}
                                >
                                    {data.best_distribution.A}
                                </td>
                                <td style={{ ...tdStyle, fontSize: "13px", color: "#666" }}>
                                    Amplitude do intervalo de confiança
                                </td>
                            </tr>

                            <tr style={trStyle}>
                                <td style={tdStyle}>
                                    <strong>Fator K (Kite)</strong>
                                </td>
                                <td style={{ ...tdStyle, fontFamily: "serif", fontSize: "18px" }}>K</td>
                                <td
                                    style={{
                                        ...tdStyle,
                                        textAlign: "right",
                                        fontFamily: "monospace",
                                        fontSize: "16px",
                                    }}
                                >
                                    {data.best_distribution.k_factor}
                                </td>
                                <td style={{ ...tdStyle, fontSize: "13px", color: "#666" }}>
                                    Fator de frequência para T=10 anos
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Fórmula do cálculo */}
                    <div
                        style={{
                            marginTop: "15px",
                            padding: "15px",
                            background: "#e3f2fd",
                            borderRadius: "5px",
                            border: "1px solid #90caf9",
                        }}
                    >
                        <h4 style={{ marginTop: "0", color: "#1976D2" }}>📐 Fórmula Aplicada:</h4>
                        {data.best_distribution.distribution === "Log-Pearson III" ||
                        data.best_distribution.distribution === "Log-Normal" ? (
                            <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
                                <strong>{data.best_distribution.distribution}:</strong>
                                <br />
                                1. ln(Q<sub>7,10</sub>) = µ<sub>ln</sub> + K × σ<sub>ln</sub>
                                <br />
                                2. Q<sub>7,10</sub> = e
                                <sup>
                                    ln(Q<sub>7,10</sub>)
                                </sup>
                                <br />
                                <br />
                                <strong>Onde:</strong>
                                <br />• µ<sub>ln</sub> = {data.best_distribution.mean.toFixed(4)} (média dos logaritmos
                                naturais)
                                <br />• σ<sub>ln</sub> = {Math.sqrt(data.best_distribution.variance).toFixed(4)} (desvio
                                padrão dos ln)
                                <br />• K = {data.best_distribution.k_factor} (fator de Kite para γ =
                                {data.best_distribution.skewness})
                                <br />• S<sub>M</sub> = {data.best_distribution.std_error} (erro padrão)
                            </div>
                        ) : (
                            <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
                                <strong>{data.best_distribution.distribution}:</strong>
                                <br />Q<sub>7,10</sub> = µ + K × σ<br />Q<sub>7,10</sub> = {data.best_distribution.mean}
                                + ({data.best_distribution.k_factor}) ×
                                {Math.sqrt(data.best_distribution.variance).toFixed(4)}
                                <br />Q<sub>7,10</sub> = {data.best_distribution.event_m3s} m³/s
                                <br />S<sub>M</sub> = {data.best_distribution.std_error} (erro padrão)
                            </div>
                        )}
                    </div>
                </div>

                {/* Notas e Avisos */}
                <div
                    style={{
                        background: isGammaValid ? "#e8f5e9" : "#fff3e0",
                        padding: "15px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: `2px solid ${isGammaValid ? "#4caf50" : "#ff9800"}`,
                    }}
                >
                    <h4 style={{ marginTop: "0", color: isGammaValid ? "#2e7d32" : "#e65100" }}>
                        {isGammaValid ? "✓ Validações do Método" : "⚠️ Avisos Importantes"}
                    </h4>
                    <div style={{ fontSize: "14px", lineHeight: "1.8", whiteSpace: "pre-line" }}>{data.notes}</div>
                    <div style={{ marginTop: "10px", fontSize: "13px", color: "#666" }}>
                        <strong>Método:</strong> {data.method_reference}
                    </div>
                </div>

                {/* Comparação de Distribuições */}
                {data.all_distributions && data.all_distributions.length > 0 && (
                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                    >
                        <h3 style={{ marginTop: "0", color: "#1976D2" }}>🔍 Comparação de Distribuições Testadas</h3>
                        <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
                            O sistema testou {data.all_distributions.length} distribuições e selecionou automaticamente
                            a que apresenta <strong>menor amplitude do intervalo de confiança (95%)</strong>.
                        </p>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Distribuição</th>
                                    <th style={thStyle}>N° eventos</th>
                                    <th style={thStyle}>IC Sup. 95%</th>
                                    <th style={thStyle}>Evento (m³/s)</th>
                                    <th style={thStyle}>IC Inf. 95%</th>
                                    <th style={thStyle}>Amplitude IC</th>
                                    <th style={thStyle}>Erro Padrão</th>
                                    <th style={thStyle}>Média</th>
                                    <th style={thStyle}>Variância</th>
                                    <th style={thStyle}>Assimetria</th>
                                    <th style={thStyle}>Alfa</th>
                                    <th style={thStyle}>Beta</th>
                                    <th style={thStyle}>Gama</th>
                                    <th style={thStyle}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.all_distributions
                                    .sort((a, b) => {
                                        const order = [
                                            "Weibull",
                                            "Pearson III",
                                            "Log-Pearson III",
                                            "Log-Normal",
                                            "Normal",
                                        ];
                                        return order.indexOf(a.distribution) - order.indexOf(b.distribution);
                                    })
                                    .map((dist, idx) => {
                                        const isBest = dist.distribution === data.best_distribution.distribution;
                                        return (
                                            <tr
                                                key={dist.distribution}
                                                style={{ ...trStyle, background: isBest ? "#e8f5e9" : "white" }}
                                            >
                                                {/* 1. Distribuição */}
                                                <td style={tdStyle}>
                                                    {isBest && "⭐ "}
                                                    {dist.distribution}
                                                </td>

                                                {/* 2. N° eventos */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>{dist.n_events}</td>

                                                {/* 3. IC Sup. 95% */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>{dist.ic_upper_95}</td>

                                                {/* 4. Evento (m³/s) */}
                                                <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>
                                                    {dist.event_m3s}
                                                </td>

                                                {/* 5. IC Inf. 95% */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>{dist.ic_lower_95}</td>

                                                {/* 6. Amplitude IC */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                                    {dist.ic_amplitude}
                                                    {isBest && " ✓"}
                                                </td>

                                                {/* 7. Erro Padrão */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>{dist.std_error}</td>

                                                {/* 8. Média */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>{dist.mean}</td>

                                                {/* 9. Variância */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                                    {dist.variance ? dist.variance.toFixed(2) : "N/A"}
                                                </td>

                                                {/* 10. Assimetria */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>{dist.skewness}</td>

                                                {/* 11. Alfa */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                                    {dist.alpha || "N/A"}
                                                </td>

                                                {/* 12. Beta */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>{dist.beta || "N/A"}</td>

                                                {/* 13. Gama (NOVO!) */}
                                                <td style={{ ...tdStyle, textAlign: "right" }}>
                                                    {dist.gamma || "N/A"}
                                                </td>

                                                {/* 14. Status */}
                                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                                    {idx === 0 ? (
                                                        <span style={{ color: "#2e7d32", fontWeight: "bold" }}>
                                                            Melhor Ajuste
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#666" }}>
                                                            {(
                                                                (dist.ic_amplitude /
                                                                    data.all_distributions[0].ic_amplitude -
                                                                    1) *
                                                                100
                                                            ).toFixed(1)}
                                                            % maior
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>

                        <div
                            style={{
                                marginTop: "15px",
                                padding: "12px",
                                background: "#f5f5f5",
                                borderRadius: "5px",
                                fontSize: "13px",
                                color: "#666",
                            }}
                        >
                            <strong>💡 Critério de seleção:</strong> A distribuição com menor amplitude do IC 95% indica
                            maior precisão na estimativa de Q7,10.
                        </div>
                    </div>
                )}
                {data.all_distributions && data.all_distributions.length > 0 && (
                    <div
                        style={{
                            background: "#263238",
                            padding: "20px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                    >
                        <h3 style={{ marginTop: "0", color: "#4CAF50", fontFamily: "monospace" }}>
                            🐛 JSON de Retorno (Debug)
                        </h3>

                        <div
                            style={{
                                background: "#1e1e1e",
                                padding: "15px",
                                borderRadius: "5px",
                                border: "1px solid #37474f",
                                maxHeight: "400px",
                                overflowY: "auto",
                            }}
                        >
                            <pre
                                style={{
                                    margin: "0",
                                    fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                                    fontSize: "12px",
                                    color: "#a9b7c6",
                                    lineHeight: "1.5",
                                    whiteSpace: "pre-wrap",
                                    wordWrap: "break-word",
                                }}
                            >
                                {JSON.stringify(
                                    data.all_distributions.map((dist) => ({
                                        Distribuição: dist.distribution,
                                        "N° eventos": dist.n_events,
                                        "IC Sup. 95%": dist.ic_upper_95,
                                        "Evento (m³/s)": dist.event_m3s,
                                        "IC Inf. 95%": dist.ic_lower_95,
                                        "Amplitude IC": dist.ic_amplitude,
                                        "Erro Padrão": dist.std_error,
                                        Média: dist.mean,
                                        Variância: dist.variance,
                                        Assimetria: dist.skewness,
                                        Alfa: dist.alpha || "N/A",
                                        Beta: dist.beta || "N/A",
                                        Gama: dist.gamma,
                                        "K Factor": dist.k_factor,
                                        Xi: dist.xi || "N/A",
                                        A: dist.A,
                                    })),
                                    null,
                                    2
                                )}
                            </pre>
                        </div>

                        <div
                            style={{
                                marginTop: "15px",
                                padding: "12px",
                                background: "#37474f",
                                borderRadius: "5px",
                                fontSize: "13px",
                                color: "#b0bec5",
                            }}
                        >
                            <strong>💡 Informação:</strong> Este JSON mostra os valores exatos retornados pelo backend
                            para validação e debug. Verifique se
                            <code style={{ background: "#1e1e1e", padding: "2px 6px", borderRadius: "3px" }}>
                                ic_lower_95 &lt; event_m3s &lt; ic_upper_95
                            </code>
                            .
                        </div>
                    </div>
                )}
                {/* Controles do Gráfico */}
                {showDistributionChart && (
                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                    >
                        <h3 style={{ marginTop: "0", color: "#1976D2" }}>📈 Visualização das Distribuições</h3>

                        <div style={{ marginBottom: "15px" }}>
                            <strong>Selecione as distribuições para visualizar:</strong>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                                    gap: "10px",
                                    marginTop: "10px",
                                }}
                            >
                                {data.all_distributions.map((dist) => (
                                    <label
                                        key={dist.distribution}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "8px",
                                            background: selectedDistributions.includes(dist.distribution)
                                                ? "#e3f2fd"
                                                : "#f5f5f5",
                                            borderRadius: "5px",
                                            cursor: "pointer",
                                            border: `2px solid ${selectedDistributions.includes(dist.distribution) ? "#1976D2" : "transparent"}`,
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDistributions.includes(dist.distribution)}
                                            onChange={() => toggleDistribution(dist.distribution)}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <span
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: selectedDistributions.includes(dist.distribution)
                                                    ? "bold"
                                                    : "normal",
                                            }}
                                        >
                                            {dist.distribution === data.best_distribution.distribution && "⭐ "}
                                            {dist.distribution}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Renderizar gráfico */}
                        {selectedDistributions.length > 0 && renderDistributionChart(data)}
                    </div>
                )}

                {/* Série Q7 Anual */}
                <div
                    style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <h3 style={{ marginTop: "0", color: "#1976D2" }}>📅 Série Histórica Q7 Anual</h3>
                    <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
                        Valores das mínimas médias de 7 dias consecutivos para cada ano da série.
                    </p>

                    <div
                        style={{
                            maxHeight: "300px",
                            overflowY: "auto",
                            border: "1px solid #e0e0e0",
                            borderRadius: "5px",
                        }}
                    >
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={{ ...thStyle, position: "sticky", top: 0 }}>Ano</th>
                                    <th style={{ ...thStyle, position: "sticky", top: 0 }}>Q7 (m³/s)</th>
                                    <th style={{ ...thStyle, position: "sticky", top: 0 }}>Comparação com Média</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.q7_values.map((q7, idx) => {
                                    const diff = q7 - data.best_distribution.mean;
                                    const diffPercent = (diff / data.best_distribution.mean) * 100;
                                    return (
                                        <tr key={idx} style={trStyle}>
                                            <td style={tdStyle}>Ano {idx + 1}</td>
                                            <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>
                                                {q7}
                                            </td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    textAlign: "right",
                                                    color: diff > 0 ? "#2e7d32" : diff < 0 ? "#c62828" : "#666",
                                                    fontFamily: "monospace",
                                                }}
                                            >
                                                {diff > 0 ? "+" : ""}
                                                {diff.toFixed(4)} ({diffPercent > 0 ? "+" : ""}
                                                {diffPercent.toFixed(1)}%)
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderDistributionChart = (data) => {
        if (selectedDistributions.length === 0) return null;

        const width = 1000;
        const height = 600;
        const marginTop = 60;
        const marginRight = 50;
        const marginBottom = 120;
        const marginLeft = 80;
        const chartWidth = width - marginLeft - marginRight;
        const chartHeight = height - marginTop - marginBottom;

        // Cores para cada distribuição
        const colors = {
            Normal: "#2196F3",
            "Log-Normal": "#4CAF50",
            "Pearson III": "#FF9800",
            "Log-Pearson III": "#9C27B0",
            Weibull: "#F44336",
        };

        // Filtrar distribuições selecionadas
        const selectedData = data.all_distributions.filter((d) => selectedDistributions.includes(d.distribution));

        if (selectedData.length === 0) {
            return (
                <div
                    style={{
                        padding: "20px",
                        background: "#ffebee",
                        borderRadius: "8px",
                        color: "#c62828",
                        textAlign: "center",
                    }}
                >
                    <strong>⚠️ Erro:</strong> Nenhuma distribuição selecionada.
                </div>
            );
        }

        // Calcular escala Y (vazões)
        const allFlows = selectedData.flatMap((d) => [d.ic_lower_95, d.event_m3s, d.ic_upper_95]);
        const minQ = Math.min(...allFlows);
        const maxQ = Math.max(...allFlows);
        const qRange = maxQ - minQ;
        const padding = qRange * 0.1;

        const yScale = (q) => {
            if (qRange === 0) return marginTop + chartHeight / 2;
            return marginTop + chartHeight - ((q - (minQ - padding)) / (qRange + 2 * padding)) * chartHeight;
        };

        // Largura de cada boxplot
        const boxWidth = Math.min(80, chartWidth / (selectedData.length * 2));
        const spacing = chartWidth / selectedData.length;

        return (
            <div style={{ marginTop: "15px" }}>
                <svg width={width} height={height} style={{ display: "block", margin: "0 auto" }}>
                    {/* Grid horizontal (vazão) */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((fraction) => {
                        const q = minQ - padding + (qRange + 2 * padding) * fraction;
                        return (
                            <g key={`grid-q-${fraction}`}>
                                <line
                                    x1={marginLeft}
                                    y1={yScale(q)}
                                    x2={width - marginRight}
                                    y2={yScale(q)}
                                    stroke="#e0e0e0"
                                    strokeWidth="1"
                                />
                                <text
                                    x={marginLeft - 10}
                                    y={yScale(q)}
                                    textAnchor="end"
                                    alignmentBaseline="middle"
                                    fontSize="11"
                                    fill="#666"
                                >
                                    {q.toFixed(3)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Eixos */}
                    <line
                        x1={marginLeft}
                        y1={marginTop}
                        x2={marginLeft}
                        y2={height - marginBottom}
                        stroke="#333"
                        strokeWidth="2"
                    />
                    <line
                        x1={marginLeft}
                        y1={height - marginBottom}
                        x2={width - marginRight}
                        y2={height - marginBottom}
                        stroke="#333"
                        strokeWidth="2"
                    />

                    {/* Boxplots */}
                    {selectedData.map((dist, idx) => {
                        const centerX = marginLeft + spacing * (idx + 0.5);
                        const color = colors[dist.distribution];

                        const yUpper = yScale(dist.ic_upper_95);
                        const yEvent = yScale(dist.event_m3s);
                        const yLower = yScale(dist.ic_lower_95);

                        return (
                            <g key={dist.distribution}>
                                {selectedData.map((dist, idx) => {
                                    const centerX = marginLeft + spacing * (idx + 0.5);
                                    const color = colors[dist.distribution];

                                    const yUpper = yScale(dist.ic_upper_95);
                                    const yEvent = yScale(dist.event_m3s);
                                    const yLower = yScale(dist.ic_lower_95);

                                    return (
                                        <g key={dist.distribution}>
                                            {/* Linha vertical COMPLETA (do limite superior ao limite inferior) */}
                                            <line
                                                x1={centerX}
                                                y1={yUpper}
                                                x2={centerX}
                                                y2={yLower}
                                                stroke={color}
                                                strokeWidth="2"
                                            />

                                            {/* Cap do limite SUPERIOR (linha horizontal acima da caixa) */}
                                            <line
                                                x1={centerX - boxWidth / 3}
                                                y1={yUpper}
                                                x2={centerX + boxWidth / 3}
                                                y2={yUpper}
                                                stroke={color}
                                                strokeWidth="3"
                                            />

                                            {/* Cap do limite INFERIOR (linha horizontal abaixo da caixa) */}
                                            <line
                                                x1={centerX - boxWidth / 3}
                                                y1={yLower}
                                                x2={centerX + boxWidth / 3}
                                                y2={yLower}
                                                stroke={color}
                                                strokeWidth="3"
                                            />

                                            {/* Caixa (box) - entre os quartis, centralizada no evento */}
                                            <rect
                                                x={centerX - boxWidth / 2}
                                                y={yEvent - (yLower - yUpper) * 0.15}
                                                width={boxWidth}
                                                height={(yLower - yUpper) * 0.3}
                                                fill={color}
                                                fillOpacity="0.6"
                                                stroke={color}
                                                strokeWidth="2"
                                            />

                                            {/* Linha do evento (mediana) - linha PRETA GROSSA no meio */}
                                            <line
                                                x1={centerX - boxWidth / 2}
                                                y1={yEvent}
                                                x2={centerX + boxWidth / 2}
                                                y2={yEvent}
                                                stroke="#333"
                                                strokeWidth="3"
                                            />

                                            {/* Rótulo do valor do EVENTO acima */}
                                            <text
                                                x={centerX}
                                                y={yUpper - 15}
                                                textAnchor="middle"
                                                fontSize="13"
                                                fontWeight="bold"
                                                fill={color}
                                            >
                                                {dist.event_m3s}
                                            </text>

                                            {/* Rótulo do limite SUPERIOR */}
                                            <text
                                                x={centerX + boxWidth / 2.5}
                                                y={yUpper + 5}
                                                textAnchor="start"
                                                fontSize="11"
                                                fill="#666"
                                            >
                                                {dist.ic_upper_95}
                                            </text>

                                            {/* Rótulo do limite INFERIOR */}
                                            <text
                                                x={centerX + boxWidth / 2.5}
                                                y={yLower + 5}
                                                textAnchor="start"
                                                fontSize="11"
                                                fill="#666"
                                            >
                                                {dist.ic_lower_95}
                                            </text>

                                            {/* Nome da distribuição no eixo X */}
                                            <text
                                                x={centerX}
                                                y={height - marginBottom + 20}
                                                textAnchor="middle"
                                                fontSize="12"
                                                fontWeight="bold"
                                                fill="#333"
                                            >
                                                {dist.distribution}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}

                    {/* Rótulo do eixo Y */}
                    <text
                        x={-height / 2}
                        y="20"
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="bold"
                        fill="#333"
                        transform="rotate(-90)"
                    >
                        Vazões (m³/s)
                    </text>

                    {/* Título */}
                    <text x={width / 2} y="30" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1976D2">
                        Comparação de Vazões Q7,10 por Distribuição
                    </text>

                    {/* Legenda */}
                    <g transform={`translate(${marginLeft}, ${height - marginBottom + 50})`}>
                        <line x1="0" y1="10" x2="20" y2="10" stroke="#333" strokeWidth="2" />
                        <text x="25" y="10" alignmentBaseline="middle" fontSize="11" fill="#333">
                            Limite superior (95%)
                        </text>

                        <rect x="150" y="3" width="20" height="14" fill="#666" fillOpacity="0.6" />
                        <text x="175" y="10" alignmentBaseline="middle" fontSize="11" fill="#333">
                            Eventos (m³/s)
                        </text>

                        <line x1="280" y1="10" x2="300" y2="10" stroke="#333" strokeWidth="3" />
                        <text x="305" y="10" alignmentBaseline="middle" fontSize="11" fill="#333">
                            Limite inferior (95%)
                        </text>
                    </g>
                </svg>

                <div
                    style={{
                        marginTop: "15px",
                        padding: "12px",
                        background: "#f5f5f5",
                        borderRadius: "5px",
                        fontSize: "13px",
                        color: "#666",
                    }}
                >
                    <strong>📊 Interpretação:</strong> Este boxplot mostra a vazão Q7,10 estimada (linha central) e seus
                    intervalos de confiança de 95% (superior e inferior) para cada distribuição probabilística testada.
                    A caixa representa a faixa de incerteza da estimativa.
                </div>
            </div>
        );
    };

    // Renderiza o estado de loading
    const renderLoading = () => (
        <div
            style={{
                padding: "40px",
                textAlign: "center",
                background: "#f5f5f5",
                borderRadius: "8px",
                marginTop: "20px",
            }}
        >
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
            <h3 style={{ color: "#666", marginBottom: "10px" }}>Calculando Q7,10...</h3>
            <p style={{ color: "#666" }}>
                Processando série histórica, calculando estatísticas e testando distribuições probabilísticas. Isso pode
                levar alguns segundos dependendo do tamanho da série.
            </p>
        </div>
    );

    // Renderiza mensagem de erro
    const renderError = (error) => (
        <div
            style={{
                padding: "20px",
                background: "#ffebee",
                borderRadius: "8px",
                color: "#c62828",
                marginTop: "20px",
            }}
        >
            <h3 style={{ marginTop: "0" }}>❌ Erro no Cálculo</h3>
            <p>
                <strong>Detalhes:</strong> {error}
            </p>
            <div
                style={{
                    marginTop: "15px",
                    padding: "12px",
                    background: "#fce4ec",
                    borderRadius: "5px",
                    fontSize: "13px",
                }}
            >
                <strong>Possíveis causas:</strong>
                <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
                    <li>ID da estação inválido ou inexistente</li>
                    <li>Dados insuficientes (mínimo 10 anos com dados completos)</li>
                    <li>Problemas de conexão com o banco de dados</li>
                    <li>Período selecionado sem dados válidos</li>
                </ul>
            </div>
        </div>
    );

    useEffect(() => {
        calculateQ710();
    }, []);

    return (
        <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Descrição */}
            <div
                style={{
                    marginBottom: "30px",
                    padding: "15px",
                    background: "#e3f2fd",
                    borderRadius: "5px",
                    border: "2px solid #2196F3",
                }}
            >
                <h3 style={{ marginTop: "0", color: "#1976D2" }}>📋 Sobre o Q7,10</h3>
                <p style={{ margin: "0", lineHeight: "1.6" }}>
                    O <strong>Q7,10</strong> representa a vazão mínima média de 7 dias consecutivos com período de
                    retorno de 10 anos (probabilidade de 90% de não excedência). É um parâmetro fundamental para outorga
                    de recursos hídricos, definição de vazões ecológicas e estudos de disponibilidade hídrica.
                </p>
            </div>

            {/* Informações sobre o método */}
            <div
                style={{
                    marginBottom: "30px",
                    padding: "15px",
                    background: "#fff3e0",
                    borderRadius: "5px",
                    border: "2px solid #ff9800",
                }}
            >
                <h4 style={{ marginTop: "0", color: "#e65100" }}>📐 Metodologia Aplicada</h4>
                <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                    <strong>Etapas do cálculo:</strong>
                    <ol style={{ margin: "10px 0", paddingLeft: "20px" }}>
                        <li>Obtenção dos dados diários válidos (filtro de meses completos)</li>
                        <li>Cálculo do Q7 anual (mínima das médias móveis de 7 dias por ano)</li>
                        <li>Cálculo das estatísticas amostrais (média, desvio padrão, assimetria)</li>
                        <li>
                            Teste de 5 distribuições probabilísticas (Normal, Log-Normal, Pearson III, Log-Pearson III,
                            Weibull)
                        </li>
                        <li>Seleção da distribuição com menor amplitude do intervalo de confiança 95%</li>
                        <li>Cálculo do Q7,10 usando o fator K de Kite (1988)</li>
                    </ol>
                    <strong>Distribuições testadas:</strong> Normal, Log-Normal, Pearson III, Log-Pearson III, Weibull
                    <br />
                    <strong>Critério de seleção:</strong> Menor amplitude do intervalo de confiança 95%
                    <br />
                    <strong>Referência:</strong> Kite (1988) - metodologia SisCAH
                </div>
            </div>

            {/* Loading */}
            {loading && renderLoading()}

            {/* Resultados */}
            {result && !loading && (
                <div>{result.success ? renderMainInfo(result.data) : renderError(result.error)}</div>
            )}
        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "8px",
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

export default Q710Analysis;
