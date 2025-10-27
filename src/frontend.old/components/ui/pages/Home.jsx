function Home({ onSelectView }) {
    const cardStyle = {
        background: "white",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        border: "3px solid transparent",
        textAlign: "center",
    };

    const cardHoverStyle = {
        transform: "translateY(-5px)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        border: "3px solid #1976D2",
    };

    return (
        <div
            style={{
                padding: "40px 20px",
                fontFamily: "Arial",
                maxWidth: "1200px",
                margin: "0 auto",
                minHeight: "100vh",
            }}
        >
            {/* Header */}
            <div
                style={{
                    textAlign: "center",
                    marginBottom: "50px",
                    background: "white",
                    padding: "30px",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
            >
                <h1
                    style={{
                        color: "#1976D2",
                        fontSize: "2.5rem",
                        marginBottom: "10px",
                    }}
                >
                    🌊 Sistema de Análise Hidrológica - ANA
                </h1>
                <p
                    style={{
                        fontSize: "1.2rem",
                        color: "#666",
                        marginBottom: "0",
                    }}
                >
                    Escolha uma ferramenta para começar
                </p>
            </div>

            {/* Cards de Navegação */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                    gap: "30px",
                }}
            >
                {/* Card 1 - Comparação de Percentis */}
                <div
                    style={cardStyle}
                    onClick={() => onSelectView("percentile")}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = cardHoverStyle.transform;
                        e.currentTarget.style.boxShadow = cardHoverStyle.boxShadow;
                        e.currentTarget.style.border = cardHoverStyle.border;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                        e.currentTarget.style.border = cardStyle.border;
                    }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📊</div>
                    <h2 style={{ color: "#1976D2", marginBottom: "15px" }}>Comparação de Métodos de Percentil</h2>
                    <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "20px" }}>
                        Compare <strong>16 métodos diferentes</strong> de cálculo de Q95, Q90 e encontre o método mais
                        adequado para sua análise.
                    </p>
                    <div
                        style={{
                            background: "#e3f2fd",
                            padding: "15px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#1976D2",
                        }}
                    >
                        <strong>✨ Funcionalidades:</strong>
                        <br />
                        • 16 métodos estatísticos
                        <br />
                        • Comparação lado a lado
                        <br />
                        • Análise de sensibilidade
                        <br />• Busca por valor target
                    </div>
                </div>

                {/* Card 2 - Teste de Estações */}
                <div
                    style={cardStyle}
                    onClick={() => onSelectView("stations")}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = cardHoverStyle.transform;
                        e.currentTarget.style.boxShadow = cardHoverStyle.boxShadow;
                        e.currentTarget.style.border = cardHoverStyle.border;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                        e.currentTarget.style.border = cardStyle.border;
                    }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🏞️</div>
                    <h2 style={{ color: "#2e7d32", marginBottom: "15px" }}>Gerenciamento de Estações</h2>
                    <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "20px" }}>
                        Busque, filtre e visualize estações fluviométricas. Teste todas as rotas de consulta ao banco de
                        dados de estações.
                    </p>
                    <div
                        style={{
                            background: "#e8f5e9",
                            padding: "15px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#2e7d32",
                        }}
                    >
                        <strong>🔍 Funcionalidades:</strong>
                        <br />
                        • Listar todas as estações
                        <br />
                        • Busca por ID específico
                        <br />
                        • Filtros avançados
                        <br />• Contagem de registros
                    </div>
                </div>

                {/* Card 3 - Análise de Vazões */}
                <div
                    style={cardStyle}
                    onClick={() => onSelectView("streamflow")}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = cardHoverStyle.transform;
                        e.currentTarget.style.boxShadow = cardHoverStyle.boxShadow;
                        e.currentTarget.style.border = cardHoverStyle.border;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                        e.currentTarget.style.border = cardStyle.border;
                    }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "20px" }}>💧</div>
                    <h2 style={{ color: "#ff9800", marginBottom: "15px" }}>Análise de Dados de Vazão</h2>
                    <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "20px" }}>
                        Exporte dados em formato tabular e analise a qualidade dos dados com estatísticas de completude
                        e identificação de valores nulos/zerados.
                    </p>
                    <div
                        style={{
                            background: "#fff3e0",
                            padding: "15px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#e65100",
                        }}
                    >
                        <strong>📈 Funcionalidades:</strong>
                        <br />
                        • Exportação tabular
                        <br />
                        • Análise de qualidade
                        <br />
                        • Estatísticas de completude
                        <br />• Identificação de falhas
                    </div>
                </div>

                {/* Card 4 - Análise Q7,10 (NOVO) */}
                <div
                    style={cardStyle}
                    onClick={() => onSelectView("q710")}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = cardHoverStyle.transform;
                        e.currentTarget.style.boxShadow = cardHoverStyle.boxShadow;
                        e.currentTarget.style.border = cardHoverStyle.border;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                        e.currentTarget.style.border = cardStyle.border;
                    }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🔬</div>
                    <h2 style={{ color: "#9C27B0", marginBottom: "15px" }}>Análise Q7,10</h2>
                    <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "20px" }}>
                        Calcule a <strong>vazão mínima de 7 dias com período de retorno de 10 anos</strong>, parâmetro
                        fundamental para outorga de recursos hídricos e estudos de disponibilidade.
                    </p>
                    <div
                        style={{
                            background: "#f3e5f5",
                            padding: "15px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#7B1FA2",
                        }}
                    >
                        <strong>📐 Funcionalidades:</strong>
                        <br />
                        • Cálculo estatístico Q7,10
                        <br />
                        • Teste de 5 distribuições probabilísticas
                        <br />
                        • Intervalos de confiança
                        <br />• Análise gráfica comparativa
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    textAlign: "center",
                    marginTop: "50px",
                    color: "#666",
                    fontSize: "14px",
                }}
            >
                <p>Sistema desenvolvido para análise de dados fluviométricos da ANA</p>
            </div>
        </div>
    );
}

export default Home;
