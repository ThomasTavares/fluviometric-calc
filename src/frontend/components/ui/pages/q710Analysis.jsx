import { useState } from "react";
import { BackButton } from "../buttons/Buttons";

function Q710Analysis({ onBack }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stationId, setStationId] = useState("70100000");
    const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
    
    const [preprocessingConfig, setPreprocessingConfig] = useState({
        mode: 'none',
        maxFailurePercentage: 10
    });

    const calculateQ710 = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Station ID required" });
            return;
        }

        setLoading(true);
        const dateRangeParam = dateRange.startDate || dateRange.endDate ? dateRange : undefined;
        const res = await window.backendApi.analysis.calculateQ710(
            stationId.trim(),
            dateRangeParam,
            preprocessingConfig
        );
        setResult(res);
        setLoading(false);
    };

    const renderMainInfo = (data) => {
        const isGammaValid = data.best_distribution.skewness >= -1.02 && data.best_distribution.skewness <= 2.0;

        return (
            <div className="result-container">
                <div className="result-header">
                    <h2>Q7,10 Result - Station {data.station_id}</h2>
                    <div className="result-grid">
                        <div className="stat-box">
                            <label>Flow Q7,10</label>
                            <div className="value">{data.best_distribution.event_m3s} m³/s</div>
                        </div>
                        <div className="stat-box">
                            <label>Distribution</label>
                            <div className="value">{data.best_distribution.distribution}</div>
                        </div>
                        <div className="stat-box">
                            <label>CI 95%</label>
                            <div className="value">
                                [{data.best_distribution.ic_lower_95}, {data.best_distribution.ic_upper_95}]
                            </div>
                            <small>Amplitude: {data.best_distribution.ic_amplitude.toFixed(4)}</small>
                        </div>
                        <div className="stat-box">
                            <label>Time Series</label>
                            <div className="value">{data.n_years} years</div>
                        </div>
                    </div>
                    <div className="period-info">
                        Period: {data.start_date} to {data.end_date}
                        {data.n_zeros > 0 && <span> | {data.n_zeros} zero-flow days</span>}
                    </div>
                </div>

                <div className="statistics-section">
                    <h3>Q7 Series Statistics</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Statistic</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Mean (µ)</td>
                                <td>{data.best_distribution.mean} m³/s</td>
                            </tr>
                            <tr>
                                <td>Std Dev (σ)</td>
                                <td>
                                    {data.best_distribution.variance
                                        ? Math.sqrt(data.best_distribution.variance).toFixed(4)
                                        : "N/A"} m³/s
                                </td>
                            </tr>
                            <tr className={isGammaValid ? "valid" : "invalid"}>
                                <td>Skewness (γ)</td>
                                <td>
                                    {data.best_distribution.skewness}
                                    {isGammaValid ? " ✓" : " ⚠️"}
                                </td>
                            </tr>
                            <tr>
                                <td>Alpha (α)</td>
                                <td>{data.best_distribution.alpha || "N/A"}</td>
                            </tr>
                            <tr>
                                <td>Beta (β)</td>
                                <td>{data.best_distribution.beta || "N/A"}</td>
                            </tr>
                            <tr>
                                <td>K Factor</td>
                                <td>{data.best_distribution.k_factor}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className={`validation-box ${isGammaValid ? "valid" : "warning"}`}>
                    <h4>{isGammaValid ? "Validation" : "Warnings"}</h4>
                    <p>{data.notes}</p>
                    <small>Method: {data.method_reference}</small>
                </div>

                {data.all_distributions && data.all_distributions.length > 0 && (
                    <div className="distributions-section">
                        <h3>Distribution Comparison</h3>
                        <p>Tested {data.all_distributions.length} distributions. Best: lowest CI amplitude.</p>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Distribution</th>
                                        <th>N</th>
                                        <th>CI Upper</th>
                                        <th>Event (m³/s)</th>
                                        <th>CI Lower</th>
                                        <th>CI Amplitude</th>
                                        <th>Std Error</th>
                                        <th>Mean</th>
                                        <th>Variance</th>
                                        <th>Skewness</th>
                                        <th>Alpha</th>
                                        <th>Beta</th>
                                        <th>Gamma</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.all_distributions
                                        .sort((a, b) => a.ic_amplitude - b.ic_amplitude)
                                        .map((dist) => {
                                            const isBest = dist.distribution === data.best_distribution.distribution;
                                            return (
                                                <tr key={dist.distribution} className={isBest ? "best" : ""}>
                                                    <td>{isBest && "⭐ "}{dist.distribution}</td>
                                                    <td>{dist.n_events}</td>
                                                    <td>{dist.ic_upper_95}</td>
                                                    <td><strong>{dist.event_m3s}</strong></td>
                                                    <td>{dist.ic_lower_95}</td>
                                                    <td>{dist.ic_amplitude}{isBest && " ✓"}</td>
                                                    <td>{dist.std_error}</td>
                                                    <td>{dist.mean}</td>
                                                    <td>{dist.variance ? dist.variance.toFixed(2) : "N/A"}</td>
                                                    <td>{dist.skewness}</td>
                                                    <td>{dist.alpha || "N/A"}</td>
                                                    <td>{dist.beta || "N/A"}</td>
                                                    <td>{dist.gamma || "N/A"}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="q7-series-section">
                    <h3>Annual Q7 Series</h3>
                    <div className="table-wrapper scrollable">
                        <table>
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Q7 (m³/s)</th>
                                    <th>Diff from Mean</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.q7_values.map((q7, idx) => {
                                    const diff = q7 - data.best_distribution.mean;
                                    const diffPercent = (diff / data.best_distribution.mean) * 100;
                                    return (
                                        <tr key={idx}>
                                            <td>Year {idx + 1}</td>
                                            <td>{q7}</td>
                                            <td className={diff > 0 ? "positive" : diff < 0 ? "negative" : ""}>
                                                {diff > 0 ? "+" : ""}{diff.toFixed(4)} ({diffPercent > 0 ? "+" : ""}{diffPercent.toFixed(1)}%)
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
        <div className="page-container">
            <BackButton onBack={onBack} />
            <h1>Q7,10 Analysis - 7-Day Low Flow (10-Year Return Period)</h1>

            <div className="config-section">
                <h3>Configuration</h3>
                
                <div className="input-grid">
                    <div>
                        <label>Station ID:</label>
                        <input 
                            type="text" 
                            value={stationId} 
                            onChange={(e) => setStationId(e.target.value)} 
                            placeholder="e.g., 70100000"
                        />
                    </div>

                    <div>
                        <label>Start Date (optional):</label>
                        <input 
                            type="date" 
                            value={dateRange.startDate} 
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} 
                        />
                    </div>

                    <div>
                        <label>End Date (optional):</label>
                        <input 
                            type="date" 
                            value={dateRange.endDate} 
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} 
                        />
                    </div>
                </div>

                <h4>Preprocessing</h4>
                <div className="preprocessing-config">
                    <div>
                        <label>Mode:</label>
                        <select 
                            value={preprocessingConfig.mode} 
                            onChange={(e) => setPreprocessingConfig(prev => ({ ...prev, mode: e.target.value }))}
                        >
                            <option value="none">None</option>
                            <option value="monthly">Monthly</option>
                            <option value="annually">Annually</option>
                        </select>
                    </div>

                    {preprocessingConfig.mode !== 'none' && (
                        <div>
                            <label>Max Failure % (0-100):</label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={preprocessingConfig.maxFailurePercentage}
                                onChange={(e) => setPreprocessingConfig(prev => ({ 
                                    ...prev, 
                                    maxFailurePercentage: parseFloat(e.target.value) 
                                }))}
                            />
                        </div>
                    )}
                </div>

                <button onClick={calculateQ710} disabled={loading} className="primary-button">
                    Calculate Q7,10
                </button>
            </div>

            {loading && <div className="loading">Calculating Q7,10...</div>}

            {result && !loading && (
                <div>
                    {result.success ? (
                        renderMainInfo(result.data)
                    ) : (
                        <div className="error">
                            <h3>Calculation Error</h3>
                            <p>{result.error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Q710Analysis;