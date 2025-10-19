import { useState } from "react";
import {
    BackButton,
    CountStationsButton,
    ExportDataButton,
    FullAnalysisButton,
    QuickSummaryButton,
} from "../buttons/Buttons";

function StreamflowTest({ onBack }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stationId, setStationId] = useState("70300000");
    const [startDate, setStartDate] = useState();
    const [endDate, setEndDate] = useState();

    // Estado para análise de nulos
    const [nullAnalysis, setNullAnalysis] = useState(null);
    const [loadingNullAnalysis, setLoadingNullAnalysis] = useState(false);

    // Função para testar a rota de export
    const testGetForExport = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Por favor, insira um ID de estação" });
            return;
        }
        setLoading(true);
        const resposta = await window.backendApi.streamflow.getForExport(
            stationId.trim(),
            startDate || undefined,
            endDate || undefined
        );
        setResult(resposta);
        setLoading(false);
    };

    const testStationCount = async () => {
        setLoading(true);
        const resposta = await window.backendApi.stations.count();
        setResult(resposta);
        setLoading(false);
    };

    // Função para análise completa de nulos
    const testAnalyzeNullFlows = async () => {
        if (!stationId.trim()) {
            setNullAnalysis({ success: false, error: "Por favor, insira um ID de estação" });
            return;
        }
        setLoadingNullAnalysis(true);
        const resposta = await window.backendApi.streamflow.analyzeNullFlows(
            stationId.trim(),
            startDate || undefined,
            endDate || undefined
        );
        setNullAnalysis(resposta);
        setLoadingNullAnalysis(false);
    };

    const testGetNullFlowsSummary = async () => {
        if (!stationId.trim()) {
            setNullAnalysis({ success: false, error: "Por favor, insira um ID de estação" });
            return;
        }
        setLoadingNullAnalysis(true);
        const resposta = await window.backendApi.streamflow.getNullFlowsSummary(
            stationId.trim(),
            startDate || undefined,
            endDate || undefined
        );
        setNullAnalysis(resposta);
        setLoadingNullAnalysis(false);
    };

    const renderExportTable = (data) => {
        if (!data || !Array.isArray(data) || data.length === 0) return null;

        return (
            <div style={{ overflowX: "auto", marginTop: "20px" }}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Ano</th>
                            <th style={thStyle}>Mês</th>
                            {[...Array(31)].map((_, i) => (
                                <th key={i} style={thStyle}>
                                    Dia {String(i + 1).padStart(2, "0")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx}>
                                <td style={tdStyle}>{row.year}</td>
                                <td style={tdStyle}>{String(row.month).padStart(2, "0")}</td>
                                {[...Array(31)].map((_, i) => {
                                    const day = String(i + 1).padStart(2, "0");
                                    const value = row[`Flow_${day}`];
                                    return (
                                        <td key={i} style={tdStyle}>
                                            {value !== null && value !== undefined ? value.toFixed(4) : "-"}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Componente para renderizar RESUMO RÁPIDO
    const renderQuickSummary = (data) => {
        const failurePercentage =
            data.total_records > 0 ? ((data.null_count + data.zero_count) / data.total_records) * 100 : 0;

        const completeness = data.completeness_percentage || 0;

        return (
            <div style={{ marginTop: "30px" }}>
                <div
                    style={{
                        background: "#fff3cd",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: "2px solid #ffc107",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>📊 Resumo Rápido</h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "15px",
                        }}
                    >
                        <div>
                            <strong>Total de Registros:</strong>
                            <br />
                            {data.total_records.toLocaleString()}
                        </div>
                        <div>
                            <strong>Vazões Nulas:</strong>
                            <br />
                            {data.null_count.toLocaleString()} (
                            {((data.null_count / data.total_records) * 100).toFixed(2)}%)
                        </div>
                        <div>
                            <strong>Vazões Zeradas:</strong>
                            <br />
                            {data.zero_count.toLocaleString()} (
                            {((data.zero_count / data.total_records) * 100).toFixed(2)}%)
                        </div>
                        <div>
                            <strong>Vazões Válidas:</strong>
                            <br />
                            {data.valid_count.toLocaleString()}
                        </div>
                        <div
                            style={{
                                background: completeness >= 90 ? "#d4edda" : completeness >= 70 ? "#fff3cd" : "#f8d7da",
                                padding: "10px",
                                borderRadius: "5px",
                                textAlign: "center",
                            }}
                        >
                            <strong>Completude:</strong>
                            <br />
                            <span style={{ fontSize: "24px", fontWeight: "bold" }}>{completeness.toFixed(2)}%</span>
                        </div>
                        <div
                            style={{
                                background:
                                    failurePercentage <= 10
                                        ? "#d4edda"
                                        : failurePercentage <= 30
                                          ? "#fff3cd"
                                          : "#f8d7da",
                                padding: "10px",
                                borderRadius: "5px",
                                textAlign: "center",
                            }}
                        >
                            <strong>Total de Falhas:</strong>
                            <br />
                            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#d32f2f" }}>
                                {failurePercentage.toFixed(2)}%
                            </span>
                            <div style={{ fontSize: "11px", marginTop: "5px" }}>(Nulos + Zeros)</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Componente para renderizar ANÁLISE COMPLETA
    const renderFullAnalysis = (data) => {
        const failurePercentage =
            data.total_records > 0 ? ((data.total_null + data.total_zero) / data.total_records) * 100 : 0;

        return (
            <div style={{ marginTop: "30px" }}>
                {/* Resumo Geral */}
                <div
                    style={{
                        background: "#fff3cd",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: "2px solid #ffc107",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>📊 Resumo Geral</h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "15px",
                        }}
                    >
                        <div>
                            <strong>Período:</strong>
                            <br />
                            {data.period.start} até {data.period.end}
                        </div>
                        <div>
                            <strong>Total de Registros:</strong>
                            <br />
                            {data.total_records.toLocaleString()}
                        </div>
                        <div>
                            <strong>Vazões Nulas:</strong>
                            <br />
                            {data.total_null.toLocaleString()} (
                            {((data.total_null / data.total_records) * 100).toFixed(2)}%)
                        </div>
                        <div>
                            <strong>Vazões Zeradas:</strong>
                            <br />
                            {data.total_zero.toLocaleString()} (
                            {((data.total_zero / data.total_records) * 100).toFixed(2)}%)
                        </div>
                        <div>
                            <strong>Vazões Válidas:</strong>
                            <br />
                            {data.total_valid.toLocaleString()}
                        </div>
                        <div
                            style={{
                                background:
                                    data.overall_completeness >= 90
                                        ? "#d4edda"
                                        : data.overall_completeness >= 70
                                          ? "#fff3cd"
                                          : "#f8d7da",
                                padding: "10px",
                                borderRadius: "5px",
                                textAlign: "center",
                            }}
                        >
                            <strong>Completude:</strong>
                            <br />
                            <span style={{ fontSize: "24px", fontWeight: "bold" }}>
                                {data.overall_completeness.toFixed(2)}%
                            </span>
                        </div>
                        <div
                            style={{
                                background:
                                    failurePercentage <= 10
                                        ? "#d4edda"
                                        : failurePercentage <= 30
                                          ? "#fff3cd"
                                          : "#f8d7da",
                                padding: "10px",
                                borderRadius: "5px",
                                textAlign: "center",
                            }}
                        >
                            <strong>Total de Falhas:</strong>
                            <br />
                            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#d32f2f" }}>
                                {failurePercentage.toFixed(2)}%
                            </span>
                            <div style={{ fontSize: "11px", marginTop: "5px" }}>(Nulos + Zeros)</div>
                        </div>
                    </div>
                </div>

                {/* Análise por Ano */}
                <div style={{ marginBottom: "20px" }}>
                    <h3>📅 Análise por Ano</h3>
                    <div style={{ overflowX: "auto" }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Ano</th>
                                    <th style={thStyle}>Total de Dias</th>
                                    <th style={thStyle}>Nulos</th>
                                    <th style={thStyle}>Zeros</th>
                                    <th style={thStyle}>Válidos</th>
                                    <th style={thStyle}>Completude (%)</th>
                                    <th style={thStyle}>Falhas (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.by_year.map((year) => {
                                    const yearFailure = ((year.null_count + year.zero_count) / year.total_days) * 100;
                                    return (
                                        <tr key={year.year}>
                                            <td style={tdStyle}>
                                                <strong>{year.year}</strong>
                                            </td>
                                            <td style={tdStyle}>{year.total_days}</td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    background: year.null_count > 0 ? "#ffebee" : "transparent",
                                                }}
                                            >
                                                {year.null_count} (
                                                {((year.null_count / year.total_days) * 100).toFixed(1)}%)
                                            </td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    background: year.zero_count > 0 ? "#fff3e0" : "transparent",
                                                }}
                                            >
                                                {year.zero_count} (
                                                {((year.zero_count / year.total_days) * 100).toFixed(1)}%)
                                            </td>
                                            <td style={{ ...tdStyle, background: "#e8f5e9" }}>{year.valid_count}</td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    background:
                                                        year.completeness >= 90
                                                            ? "#c8e6c9"
                                                            : year.completeness >= 70
                                                              ? "#fff9c4"
                                                              : "#ffcdd2",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {year.completeness.toFixed(2)}%
                                            </td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    background:
                                                        yearFailure <= 10
                                                            ? "#c8e6c9"
                                                            : yearFailure <= 30
                                                              ? "#fff9c4"
                                                              : "#ffcdd2",
                                                    fontWeight: "bold",
                                                    color: "#d32f2f",
                                                }}
                                            >
                                                {yearFailure.toFixed(2)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Análise por Mês */}
                <div>
                    <h3>📆 Análise Detalhada por Mês</h3>
                    <div style={{ overflowX: "auto", maxHeight: "500px", overflowY: "auto" }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Ano</th>
                                    <th style={thStyle}>Mês</th>
                                    <th style={thStyle}>Total Dias</th>
                                    <th style={thStyle}>Nulos</th>
                                    <th style={thStyle}>Nulos (%)</th>
                                    <th style={thStyle}>Zeros</th>
                                    <th style={thStyle}>Zeros (%)</th>
                                    <th style={thStyle}>Válidos</th>
                                    <th style={thStyle}>Completude (%)</th>
                                    <th style={thStyle}>Falhas (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.by_month.map((month, idx) => {
                                    const monthFailure = month.null_percentage + month.zero_percentage;
                                    return (
                                        <tr key={idx}>
                                            <td style={tdStyle}>{month.year}</td>
                                            <td style={tdStyle}>{String(month.month).padStart(2, "0")}</td>
                                            <td style={tdStyle}>{month.total_days}</td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    background: month.null_count > 0 ? "#ffebee" : "transparent",
                                                }}
                                            >
                                                {month.null_count}
                                            </td>
                                            <td style={tdStyle}>{month.null_percentage.toFixed(1)}%</td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    background: month.zero_count > 0 ? "#fff3e0" : "transparent",
                                                }}
                                            >
                                                {month.zero_count}
                                            </td>
                                            <td style={tdStyle}>{month.zero_percentage.toFixed(1)}%</td>
                                            <td style={{ ...tdStyle, background: "#e8f5e9" }}>{month.valid_count}</td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    background:
                                                        month.completeness >= 90
                                                            ? "#c8e6c9"
                                                            : month.completeness >= 70
                                                              ? "#fff9c4"
                                                              : "#ffcdd2",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {month.completeness.toFixed(2)}%
                                            </td>
                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    background:
                                                        monthFailure <= 10
                                                            ? "#c8e6c9"
                                                            : monthFailure <= 30
                                                              ? "#fff9c4"
                                                              : "#ffcdd2",
                                                    fontWeight: "bold",
                                                    color: "#d32f2f",
                                                }}
                                            >
                                                {monthFailure.toFixed(2)}%
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

    return (
        <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "1400px", margin: "0 auto" }}>
            <BackButton onBack={onBack} />

            <h1>Teste de Rotas - Dados de Vazão</h1>

            {/* Testes Básicos */}
            <div style={{ marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "5px" }}>
                <h3>Testes Básicos</h3>
                <CountStationsButton onClick={testStationCount} loading={loading} />
            </div>

            {/* Exportar Dados para Formato de Tabela */}
            <div
                style={{
                    marginBottom: "30px",
                    padding: "15px",
                    background: "#e3f2fd",
                    borderRadius: "5px",
                    border: "2px solid #2196F3",
                }}
            >
                <h3>Exportar Dados para Formato de Tabela</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    <div>
                        <label style={labelStyle}>ID da Estação:</label>
                        <input
                            type="text"
                            value={stationId}
                            onChange={(e) => setStationId(e.target.value)}
                            placeholder="Ex: 70300000"
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Data Inicial (opcional):</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Data Final (opcional):</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <ExportDataButton onClick={testGetForExport} loading={loading} />
                <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                    Se não informar datas, retorna todos os dados da estação
                </p>
            </div>

            {/* NOVO: Análise de Vazões Nulas e Zeros */}
            <div
                style={{
                    marginBottom: "30px",
                    padding: "15px",
                    background: "#ffe0b2",
                    borderRadius: "5px",
                    border: "2px solid #ff9800",
                }}
            >
                <h3>🔍 Análise de Vazões Nulas e Zeros</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    <div>
                        <label style={labelStyle}>ID da Estação:</label>
                        <input
                            type="text"
                            value={stationId}
                            onChange={(e) => setStationId(e.target.value)}
                            placeholder="Ex: 70300000"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Data Inicial (opcional):</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Data Final (opcional):</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                </div>

                <FullAnalysisButton onClick={testAnalyzeNullFlows} loading={loadingNullAnalysis} />
                <QuickSummaryButton onClick={testGetNullFlowsSummary} loading={loadingNullAnalysis} />

                <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                    Analisa a quantidade de vazões nulas e zeradas no período selecionado
                </p>
            </div>

            {/* Loading da tabela de exportação */}
            {loading && <p style={{ fontSize: "18px", color: "#666" }}>Carregando...</p>}

            {/* Resultado da tabela de exportação */}
            {result && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2>Resultado:</h2>
                        {result.success && result.data && Array.isArray(result.data) && (
                            <span style={{ fontSize: "16px", color: "#666" }}>
                                {result.data.length} registro(s) encontrado(s)
                            </span>
                        )}
                    </div>

                    {/* Renderiza tabela se for resultado de export */}
                    {result.success &&
                        result.data &&
                        Array.isArray(result.data) &&
                        result.data.length > 0 &&
                        result.data[0].Flow_01 !== undefined &&
                        renderExportTable(result.data)}

                    {/* JSON completo */}
                    <pre
                        style={{
                            background: "#f4f4f4",
                            padding: "15px",
                            borderRadius: "5px",
                            overflow: "auto",
                            maxHeight: "500px",
                            fontSize: "12px",
                            border: "1px solid #ddd",
                            marginTop: "20px",
                        }}
                    >
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            {/* Loading da análise de nulos */}
            {loadingNullAnalysis && <p style={{ fontSize: "18px", color: "#666" }}>Analisando dados...</p>}

            {/* Renderiza análise de nulos */}
            {nullAnalysis && nullAnalysis.success && nullAnalysis.data && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2>Análise de Qualidade dos Dados:</h2>
                        <span style={{ fontSize: "16px", color: "#666" }}>
                            Estação: {nullAnalysis.data.station_id || stationId}
                        </span>
                    </div>

                    {/* Renderiza visualização - verifica qual tipo de análise */}
                    {nullAnalysis.data.by_year && nullAnalysis.data.by_month
                        ? renderFullAnalysis(nullAnalysis.data)
                        : renderQuickSummary(nullAnalysis.data)}

                    {/* JSON completo da análise */}
                    <pre
                        style={{
                            background: "#f4f4f4",
                            padding: "15px",
                            borderRadius: "5px",
                            overflow: "auto",
                            maxHeight: "500px",
                            fontSize: "12px",
                            border: "1px solid #ddd",
                            marginTop: "20px",
                        }}
                    >
                        {JSON.stringify(nullAnalysis, null, 2)}
                    </pre>
                </div>
            )}

            {/* Erro da análise de nulos */}
            {nullAnalysis && !nullAnalysis.success && (
                <div
                    style={{
                        background: "#f8d7da",
                        color: "#721c24",
                        padding: "15px",
                        borderRadius: "5px",
                        border: "1px solid #f5c6cb",
                        marginTop: "20px",
                    }}
                >
                    <strong>Erro:</strong> {nullAnalysis.error}
                </div>
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
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "11px",
    border: "1px solid #ddd",
};

const thStyle = {
    background: "#2196F3",
    color: "white",
    padding: "8px 4px",
    border: "1px solid #ddd",
    textAlign: "center",
    position: "sticky",
    top: 0,
    zIndex: 1,
};

const tdStyle = {
    padding: "6px 4px",
    border: "1px solid #ddd",
    textAlign: "center",
};

export default StreamflowTest;
