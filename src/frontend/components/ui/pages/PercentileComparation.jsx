import { useState } from "react";
import { BackButton } from "../buttons/Buttons";

function PercentileComparison({ onBack }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stationId, setStationId] = useState("65295000");
    const [percentile, setPercentile] = useState(95);
    const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
    const [numberOfPoints, setNumberOfPoints] = useState(100);
    
    const [preprocessingConfig, setPreprocessingConfig] = useState({
        mode: 'none',
        maxFailurePercentage: 10
    });

    const calculateSinglePercentile = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Station ID required" });
            return;
        }

        setLoading(true);
        const res = await window.backendApi.analysis.calculatePercentileWithMethod(
            stationId.trim(),
            percentile,
            "weibull",
            dateRange.startDate || dateRange.endDate ? dateRange : undefined,
            preprocessingConfig
        );
        setResult({ ...res, type: "single" });
        setLoading(false);
    };

    const calculateAllPercentiles = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Station ID required" });
            return;
        }

        setLoading(true);
        const dateRangeParam = dateRange.startDate || dateRange.endDate ? dateRange : undefined;
        const res = await window.backendApi.analysis.calculateAllPercentiles(
            stationId.trim(),
            dateRangeParam,
            preprocessingConfig
        );
        setResult({ ...res, type: "all" });
        setLoading(false);
    };

    const calculateFlowDurationCurve = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Station ID required" });
            return;
        }

        setLoading(true);
        const dateRangeParam = dateRange.startDate || dateRange.endDate ? dateRange : undefined;
        const res = await window.backendApi.analysis.calculateFlowDurationCurve(
            stationId.trim(),
            dateRangeParam,
            numberOfPoints,
            preprocessingConfig
        );
        setResult({ ...res, type: "curve" });
        setLoading(false);
    };

    const renderSingleResult = (data) => (
        <div className="result-card">
            <h3>Percentile Q{data.percentile}</h3>
            <p>Flow Rate: {data.value.toFixed(4)} m³/s</p>
        </div>
    );

    const renderAllPercentiles = (data) => (
        <div className="result-card">
            <h3>Station {data.station_id}</h3>
            <p>Total Records: {data.total_records}</p>
            {data.date_range && (
                <p>Period: {data.date_range.start_date} to {data.date_range.end_date}</p>
            )}
            <table>
                <thead>
                    <tr>
                        <th>Percentile</th>
                        <th>Flow (m³/s)</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data.percentiles).map(([key, value]) => (
                        <tr key={key}>
                            <td>{key}</td>
                            <td>{value.toFixed(4)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderCurve = (data) => {
        const points = data.curve_points;
        const width = 1000;
        const height = 600;
        const margin = { top: 60, right: 80, bottom: 80, left: 80 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const maxFlow = Math.max(...points.map(p => p.flow_rate));
        const minFlow = Math.min(...points.map(p => p.flow_rate));
        const flowRange = maxFlow - minFlow;

        const yScale = (flow) => margin.top + chartHeight - ((flow - minFlow) / flowRange) * chartHeight;
        const xScale = (percentile) => margin.left + (percentile / 100) * chartWidth;

        const pathData = points.map((point, i) => {
            const x = xScale(point.percentile);
            const y = yScale(point.flow_rate);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        }).join(" ");

        return (
            <div className="result-card">
                <h3>Flow Duration Curve - Station {data.station_id}</h3>
                <p>Total Records: {data.total_records} | Points: {points.length}</p>
                <svg width={width} height={height}>
                    <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#333" strokeWidth="2" />
                    <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#333" strokeWidth="2" />
                    
                    <path d={pathData} fill="none" stroke="#1976D2" strokeWidth="3" />
                    
                    <text x={width / 2} y={30} textAnchor="middle" fontSize="16" fontWeight="bold">
                        Flow Duration Curve - Weibull Method
                    </text>
                    <text x={margin.left + chartWidth / 2} y={height - 20} textAnchor="middle" fontSize="14">
                        Percentile (%)
                    </text>
                    <text x={20} y={margin.top + chartHeight / 2} textAnchor="middle" fontSize="14" transform={`rotate(-90, 20, ${margin.top + chartHeight / 2})`}>
                        Flow Rate (m³/s)
                    </text>
                </svg>
            </div>
        );
    };

    return (
        <div className="page-container">
            <BackButton onBack={onBack} />
            <h1>Percentile Analysis - Weibull Method</h1>

            <div className="config-section">
                <h3>Configuration</h3>
                
                <label>Station ID:</label>
                <input type="text" value={stationId} onChange={(e) => setStationId(e.target.value)} />

                <label>Percentile (0-100):</label>
                <input type="number" min="0" max="100" value={percentile} onChange={(e) => setPercentile(parseFloat(e.target.value))} />

                <label>Start Date:</label>
                <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} />

                <label>End Date:</label>
                <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} />

                <h4>Preprocessing</h4>
                <label>Mode:</label>
                <select value={preprocessingConfig.mode} onChange={(e) => setPreprocessingConfig(prev => ({ ...prev, mode: e.target.value }))}>
                    <option value="none">None</option>
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                </select>

                {preprocessingConfig.mode !== 'none' && (
                    <>
                        <label>Max Failure %:</label>
                        <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={preprocessingConfig.maxFailurePercentage}
                            onChange={(e) => setPreprocessingConfig(prev => ({ ...prev, maxFailurePercentage: parseFloat(e.target.value) }))}
                        />
                    </>
                )}

                <label>Curve Points:</label>
                <input type="number" min="10" max="500" value={numberOfPoints} onChange={(e) => setNumberOfPoints(parseInt(e.target.value))} />

                <div className="button-group">
                    <button onClick={calculateSinglePercentile} disabled={loading}>Calculate Single</button>
                    <button onClick={calculateAllPercentiles} disabled={loading}>Calculate All</button>
                    <button onClick={calculateFlowDurationCurve} disabled={loading}>Generate Curve</button>
                </div>
            </div>

            {loading && <div className="loading">Processing...</div>}

            {result && !loading && (
                <div>
                    {result.success ? (
                        <>
                            {result.type === "single" && renderSingleResult(result.data)}
                            {result.type === "all" && renderAllPercentiles(result.data)}
                            {result.type === "curve" && renderCurve(result.data)}
                        </>
                    ) : (
                        <div className="error">Error: {result.error}</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PercentileComparison;
