import { createRoot } from "react-dom/client";
import { useState } from "react";

function App() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchId, setSearchId] = useState("");
    const [searchFilters, setSearchFilters] = useState({
        id: "",
        name: "",
        basin_code: "",
        sub_basin_code: "",
        river_name: "",
        state_name: "",
        city_name: "",
    });

    const testGetAll = async () => {
        setLoading(true);
        const res = await window.backendApi.stations.getAll();
        setResult(res);
        setLoading(false);
    };

    const testGetById = async () => {
        if (!searchId.trim()) {
            setResult({ success: false, error: "Por favor, insira um ID" });
            return;
        }

        setLoading(true);
        const res = await window.backendApi.stations.getById(searchId.trim());
        setResult(res);
        setLoading(false);
    };

    const testSearch = async () => {
        setLoading(true);

        const filters = {};
        if (searchFilters.id) filters.id = searchFilters.id;
        if (searchFilters.name) filters.name = searchFilters.name;
        if (searchFilters.basin_code) filters.basin_code = searchFilters.basin_code;
        if (searchFilters.sub_basin_code) filters.sub_basin_code = searchFilters.sub_basin_code;
        if (searchFilters.river_name) filters.river_name = searchFilters.river_name;
        if (searchFilters.state_name) filters.state_name = searchFilters.state_name;
        if (searchFilters.city_name) filters.city_name = searchFilters.city_name;

        const res = await window.backendApi.stations.search(filters);
        setResult(res);
        setLoading(false);
    };

    const testCount = async () => {
        setLoading(true);
        const res = await window.backendApi.stations.count();
        setResult(res);
        setLoading(false);
    };

    const handleFilterChange = (field, value) => {
        setSearchFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const clearFilters = () => {
        setSearchFilters({
            id: "",
            name: "",
            basin_code: "",
            sub_basin_code: "",
            river_name: "",
            state_name: "",
            city_name: "",
        });
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "1200px", margin: "0 auto" }}>
            <h1>Teste de Rotas - Estações Fluviométricas</h1>

            <div style={{ marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "5px" }}>
                <h3>Testes Básicos</h3>

                <button onClick={testGetAll} disabled={loading} style={buttonStyle}>
                    Listar Todas
                </button>

                <button onClick={testCount} disabled={loading} style={buttonStyle}>
                    Contar Estações
                </button>

                <div style={{ marginTop: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Digite o ID (ex: 73600000)"
                        style={{ ...inputStyle, width: "250px" }}
                    />
                    <button onClick={testGetById} disabled={loading} style={buttonStyle}>
                        Buscar por ID
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: "30px", padding: "15px", background: "#e8f4f8", borderRadius: "5px" }}>
                <h3>Busca Avançada com Filtros</h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                    <div>
                        <label style={labelStyle}>Nome da Estação:</label>
                        <input
                            type="text"
                            value={searchFilters.name}
                            onChange={(e) => handleFilterChange("name", e.target.value)}
                            placeholder="Ex: ABELARDO"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Código da Bacia:</label>
                        <input
                            type="text"
                            value={searchFilters.basin_code}
                            onChange={(e) => handleFilterChange("basin_code", e.target.value)}
                            placeholder="Ex: 7 - RIO URUGUAI"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Código Sub-Bacia:</label>
                        <input
                            type="text"
                            value={searchFilters.sub_basin_code}
                            onChange={(e) => handleFilterChange("sub_basin_code", e.target.value)}
                            placeholder="Ex: 73 - RIOS URUGUAI"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Nome do Rio:</label>
                        <input
                            type="text"
                            value={searchFilters.river_name}
                            onChange={(e) => handleFilterChange("river_name", e.target.value)}
                            placeholder="Ex: PALMEIRAS"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Estado:</label>
                        <input
                            type="text"
                            value={searchFilters.state_name}
                            onChange={(e) => handleFilterChange("state_name", e.target.value)}
                            placeholder="Ex: SANTA CATARINA"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Município:</label>
                        <input
                            type="text"
                            value={searchFilters.city_name}
                            onChange={(e) => handleFilterChange("city_name", e.target.value)}
                            placeholder="Ex: ABELARDO LUZ"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <button onClick={testSearch} disabled={loading} style={{ ...buttonStyle, background: "#2196F3" }}>
                    Buscar com Filtros
                </button>
                <button onClick={clearFilters} style={{ ...buttonStyle, background: "#757575" }}>
                    Limpar Filtros
                </button>
            </div>

            {loading && <p style={{ fontSize: "18px", color: "#666" }}>Carregando...</p>}

            {result && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2>Resultado:</h2>
                        {result.success && result.data && Array.isArray(result.data) && (
                            <span style={{ fontSize: "16px", color: "#666" }}>
                                {result.data.length} estação(ões) encontrada(s)
                            </span>
                        )}
                        {result.success &&
                            result.data &&
                            !Array.isArray(result.data) &&
                            result.data.count !== undefined && (
                                <span style={{ fontSize: "16px", color: "#666" }}>
                                    Total: {result.data.count} estações
                                </span>
                            )}
                    </div>

                    <pre
                        style={{
                            background: "#f4f4f4",
                            padding: "15px",
                            borderRadius: "5px",
                            overflow: "auto",
                            maxHeight: "500px",
                            fontSize: "12px",
                            border: "1px solid #ddd",
                        }}
                    >
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

const buttonStyle = {
    padding: "10px 20px",
    marginRight: "10px",
    marginBottom: "10px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
};

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

const root = createRoot(document.getElementById("root"));
root.render(<App />);
