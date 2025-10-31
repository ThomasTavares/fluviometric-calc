import { useState } from "react";
import { BackButton } from "../buttons/Buttons";

function Preprocessing({ onBack }) {
    const [stationId, setStationId] = useState("70300000");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterMode, setFilterMode] = useState("monthly");
    const [maxFailurePercentage, setMaxFailurePercentage] = useState(10);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePreprocess = async () => {
        if (!stationId.trim()) {
            setResult({ success: false, error: "Station ID required" });
            return;
        }

        if (maxFailurePercentage < 0 || maxFailurePercentage > 100) {
            setResult({ success: false, error: "Failure percentage must be between 0 and 100" });
            return;
        }

        setLoading(true);

        const config = {
            stationId: stationId.trim(),
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            mode: filterMode,
            maxFailurePercentage: parseFloat(maxFailurePercentage),
        };

        try {
            const response = await window.backendApi.preprocessing.analyze(config);
            setResult(response);
        } catch (error) {
            setResult({
                success: false,
                error: `Preprocessing error: ${error.message}`,
            });
        }

        setLoading(false);
    };

    const renderMonthsTable = (monthsTable) => {
        if (!monthsTable || monthsTable.length === 0) return null;

        return (
            <div className="result-section">
                <h3>Monthly Analysis</h3>
                <div className="table-container">
                    <table className="analysis-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Year</th>
                                <th>Month</th>
                                <th>Total Days</th>
                                <th>Valid Days</th>
                                <th>Null Days</th>
                                <th>Zero Days</th>
                                <th>Failure %</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthsTable.map((month, idx) => (
                                <tr key={idx} className={month.isIncluded ? "included" : "excluded"}>
                                    <td>{month.isIncluded ? "✅" : "❌"}</td>
                                    <td>
                                        <strong>{month.year}</strong>
                                    </td>
                                    <td>
                                        {String(month.month).padStart(2, "0")} - {month.monthName}
                                    </td>
                                    <td>{month.totalDays}</td>
                                    <td className="valid-cell">{month.validDays}</td>
                                    <td className={month.nullDays > 0 ? "null-cell" : ""}>{month.nullDays}</td>
                                    <td className={month.zeroDays > 0 ? "zero-cell" : ""}>{month.zeroDays}</td>
                                    <td
                                        className={`failure-cell ${month.failurePercentage <= 10 ? "low" : month.failurePercentage <= 30 ? "medium" : "high"}`}
                                    >
                                        {month.failurePercentage.toFixed(2)}%
                                    </td>
                                    <td className="reason-cell">
                                        {month.isIncluded ? "✓ Included" : month.reason || "Excluded"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderYearsTable = (yearsTable) => {
        if (!yearsTable || yearsTable.length === 0) return null;

        return (
            <div className="result-section">
                <h3>Annual Analysis</h3>
                <div className="table-container">
                    <table className="analysis-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Year</th>
                                <th>Total Days</th>
                                <th>Valid Days</th>
                                <th>Null Days</th>
                                <th>Zero Days</th>
                                <th>Failure %</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {yearsTable.map((year, idx) => (
                                <tr key={idx} className={year.isIncluded ? "included" : "excluded"}>
                                    <td>{year.isIncluded ? "✅" : "❌"}</td>
                                    <td>
                                        <strong>{year.year}</strong>
                                    </td>
                                    <td>{year.totalDays}</td>
                                    <td className="valid-cell">{year.validDays}</td>
                                    <td className={year.nullDays > 0 ? "null-cell" : ""}>{year.nullDays}</td>
                                    <td className={year.zeroDays > 0 ? "zero-cell" : ""}>{year.zeroDays}</td>
                                    <td
                                        className={`failure-cell ${year.failurePercentage <= 10 ? "low" : year.failurePercentage <= 30 ? "medium" : "high"}`}
                                    >
                                        {year.failurePercentage.toFixed(2)}%
                                    </td>
                                    <td className="reason-cell">
                                        {year.isIncluded ? "✓ Included" : year.reason || "Excluded"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAnalysisSummary = (analysis) => {
        const { mode, period, totalPeriods, includedPeriods, excludedPeriods, totalValidFlows, overallCompleteness } =
            analysis;

        return (
            <div className="summary-card">
                <h3>Preprocessing Summary - {mode === "monthly" ? "Monthly Mode" : "Annual Mode"}</h3>

                <div className="summary-grid">
                    <div className="summary-item">
                        <div className="summary-label">Period Analyzed</div>
                        <div className="summary-value">
                            {new Date(period.start).toLocaleDateString()} to {new Date(period.end).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="summary-item">
                        <div className="summary-label">{mode === "monthly" ? "Total Months" : "Total Years"}</div>
                        <div className="summary-value">{totalPeriods}</div>
                    </div>

                    <div className="summary-item included">
                        <div className="summary-label">{mode === "monthly" ? "Months Included" : "Years Included"}</div>
                        <div className="summary-value">{includedPeriods}</div>
                        <div className="summary-percentage">
                            ({((includedPeriods / totalPeriods) * 100).toFixed(1)}%)
                        </div>
                    </div>

                    <div className="summary-item excluded">
                        <div className="summary-label">{mode === "monthly" ? "Months Excluded" : "Years Excluded"}</div>
                        <div className="summary-value">{excludedPeriods}</div>
                        <div className="summary-percentage">
                            ({((excludedPeriods / totalPeriods) * 100).toFixed(1)}%)
                        </div>
                    </div>

                    <div className="summary-item valid">
                        <div className="summary-label">Valid Flows</div>
                        <div className="summary-value">{totalValidFlows.toLocaleString()}</div>
                        <div className="summary-percentage">ready for calculation</div>
                    </div>

                    <div
                        className={`summary-item completeness ${overallCompleteness >= 90 ? "high" : overallCompleteness >= 70 ? "medium" : "low"}`}
                    >
                        <div className="summary-label">Overall Completeness</div>
                        <div className="summary-value">{overallCompleteness.toFixed(2)}%</div>
                        <div className="summary-percentage">of included periods</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="page-container">
            <BackButton onBack={onBack} />
            <h1>Data Preprocessing</h1>

            <div className="config-section">
                <h3>Configuration</h3>

                <label>Station ID:</label>
                <input type="text" value={stationId} onChange={(e) => setStationId(e.target.value)} />

                <label>Start Date:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

                <label>End Date:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

                <label>Filter Mode:</label>
                <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                </select>

                <label>Max Failure Percentage: {maxFailurePercentage}%</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={maxFailurePercentage}
                    onChange={(e) => setMaxFailurePercentage(e.target.value)}
                />

                <button onClick={handlePreprocess} disabled={loading}>
                    {loading ? "Processing..." : "Run Preprocessing"}
                </button>
            </div>

            {loading && <div className="loading">Processing...</div>}

            {result && !loading && (
                <div>
                    {result.success ? (
                        <div>
                            {renderAnalysisSummary(result.data.analysis)}
                            {result.data.monthsTable && renderMonthsTable(result.data.monthsTable)}
                            {result.data.yearsTable && renderYearsTable(result.data.yearsTable)}
                        </div>
                    ) : (
                        <div className="error">Error: {result.error}</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Preprocessing;
