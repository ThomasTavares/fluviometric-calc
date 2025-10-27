import React from "react";

const ButtonWrapper = ({ children, style = {} }) => {
    return (
        <div
            style={{
                display: "inline-block",
                marginRight: "10px",
                marginBottom: "10px",
                ...style,
            }}
        >
            {children}
        </div>
    );
};

export const BackButton = ({ onBack, label = "Voltar ao Menu", style = {} }) => {
    const baseStyle = {
        padding: "10px 20px",
        background: "#757575",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontSize: "14px",
        transition: "background-color 0.2s",
    };

    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <ButtonWrapper style={{ marginBottom: "20px", display: "block" }}>
            <button
                onClick={onBack}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    ...baseStyle,
                    backgroundColor: isHovered ? "#5d5d5d" : "#757575",
                    ...style,
                }}
            >
                ← {label}
            </button>
        </ButtonWrapper>
    );
};

export const PrimaryButton = ({ children, onClick, disabled = false, style = {}, size = "medium" }) => {
    const sizes = {
        small: { padding: "8px 16px", fontSize: "12px" },
        medium: { padding: "10px 20px", fontSize: "14px" },
        large: { padding: "15px 30px", fontSize: "18px" },
    };

    const buttonStyle = {
        ...sizes[size],
        background: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        transition: "all 0.3s",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
    };

    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <ButtonWrapper style={style}>
            <button
                onClick={disabled ? undefined : onClick}
                onMouseEnter={() => !disabled && setIsHovered(true)}
                onMouseLeave={() => !disabled && setIsHovered(false)}
                disabled={disabled}
                style={{
                    ...buttonStyle,
                    backgroundColor: disabled ? "#4CAF50" : isHovered ? "#45a049" : "#4CAF50",
                    transform: disabled ? "none" : isHovered ? "translateY(-1px)" : "none",
                    boxShadow: disabled
                        ? "none"
                        : isHovered
                          ? "0 4px 8px rgba(0,0,0,0.2)"
                          : "0 2px 4px rgba(0,0,0,0.1)",
                }}
            >
                {children}
            </button>
        </ButtonWrapper>
    );
};

export const SecondaryButton = ({ children, onClick, disabled = false, style = {}, size = "medium" }) => {
    const sizes = {
        small: { padding: "8px 16px", fontSize: "12px" },
        medium: { padding: "10px 20px", fontSize: "14px" },
        large: { padding: "15px 30px", fontSize: "18px" },
    };

    const buttonStyle = {
        ...sizes[size],
        background: "#2196F3",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        transition: "all 0.3s",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
    };

    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <ButtonWrapper style={style}>
            <button
                onClick={disabled ? undefined : onClick}
                onMouseEnter={() => !disabled && setIsHovered(true)}
                onMouseLeave={() => !disabled && setIsHovered(false)}
                disabled={disabled}
                style={{
                    ...buttonStyle,
                    backgroundColor: disabled ? "#2196F3" : isHovered ? "#1976D2" : "#2196F3",
                    transform: disabled ? "none" : isHovered ? "translateY(-1px)" : "none",
                    boxShadow: disabled
                        ? "none"
                        : isHovered
                          ? "0 4px 8px rgba(0,0,0,0.2)"
                          : "0 2px 4px rgba(0,0,0,0.1)",
                }}
            >
                {children}
            </button>
        </ButtonWrapper>
    );
};

export const WarningButton = ({ children, onClick, disabled = false, style = {}, size = "medium" }) => {
    const sizes = {
        small: { padding: "8px 16px", fontSize: "12px" },
        medium: { padding: "10px 20px", fontSize: "14px" },
        large: { padding: "15px 30px", fontSize: "18px" },
    };

    const buttonStyle = {
        ...sizes[size],
        background: "#FF9800",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        transition: "all 0.3s",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
    };

    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <ButtonWrapper style={style}>
            <button
                onClick={disabled ? undefined : onClick}
                onMouseEnter={() => !disabled && setIsHovered(true)}
                onMouseLeave={() => !disabled && setIsHovered(false)}
                disabled={disabled}
                style={{
                    ...buttonStyle,
                    backgroundColor: disabled ? "#FF9800" : isHovered ? "#F57C00" : "#FF9800",
                    transform: disabled ? "none" : isHovered ? "translateY(-1px)" : "none",
                    boxShadow: disabled
                        ? "none"
                        : isHovered
                          ? "0 4px 8px rgba(0,0,0,0.2)"
                          : "0 2px 4px rgba(0,0,0,0.1)",
                }}
            >
                {children}
            </button>
        </ButtonWrapper>
    );
};

export const StationListButton = ({ onClick, loading = false, disabled = false }) => {
    return (
        <SecondaryButton onClick={onClick} disabled={disabled || loading}>
            {loading ? "Carregando..." : "📋 Listar Estações"}
        </SecondaryButton>
    );
};

export const CompareMethodsButton = ({ onClick, loading = false, disabled = false, percentile = 95 }) => {
    return (
        <PrimaryButton
            onClick={onClick}
            disabled={disabled || loading}
            size="large"
            style={{ fontSize: "18px", padding: "15px 30px" }}
        >
            🚀 Comparar TODOS os Métodos (Q{percentile})
        </PrimaryButton>
    );
};

export const CalculatePercentilesButton = ({ onClick, loading = false, disabled = false }) => {
    return (
        <WarningButton onClick={onClick} disabled={disabled || loading}>
            📊 Calcular Todos os Percentis
        </WarningButton>
    );
};

export const SearchWithFiltersButton = ({ onClick, loading = false, disabled = false }) => {
    return (
        <SecondaryButton onClick={onClick} disabled={disabled || loading}>
            Buscar com Filtros
        </SecondaryButton>
    );
};

export const ClearFiltersButton = ({ onClick }) => {
    return <SecondaryButton onClick={onClick}>Limpar Filtros</SecondaryButton>;
};

export const FullAnalysisButton = ({ onClick, loading = false, disabled = false }) => {
    return (
        <WarningButton onClick={onClick} disabled={disabled || loading}>
            Análise Completa (Por Ano e Mês)
        </WarningButton>
    );
};

export const QuickSummaryButton = ({ onClick, loading = false, disabled = false }) => {
    return (
        <WarningButton onClick={onClick} disabled={disabled || loading}>
            Resumo Rápido
        </WarningButton>
    );
};

export const ExportDataButton = ({ onClick, loading = false, disabled = false }) => {
    return (
        <SecondaryButton onClick={onClick} disabled={disabled || loading}>
            Buscar Dados para Exportação
        </SecondaryButton>
    );
};

export const CountStationsButton = ({ onClick, loading = false, disabled = false }) => {
    return (
        <PrimaryButton onClick={onClick} disabled={disabled || loading}>
            Contar Estações
        </PrimaryButton>
    );
};

export const ListAllButton = ({ onClick, loading = false, disabled = false }) => {
    return (
        <PrimaryButton onClick={onClick} disabled={disabled || loading}>
            Listar Todas
        </PrimaryButton>
    );
};

export const SearchByIdButton = ({ onClick, loading = false, disabled = false }) => {
    return (
        <PrimaryButton onClick={onClick} disabled={disabled || loading}>
            Buscar por ID
        </PrimaryButton>
    );
};

export default {
    BackButton,

    PrimaryButton,
    SecondaryButton,
    WarningButton,

    StationListButton,
    CompareMethodsButton,
    CalculatePercentilesButton,
    SearchWithFiltersButton,
    ClearFiltersButton,
    FullAnalysisButton,
    QuickSummaryButton,
    ExportDataButton,
    CountStationsButton,
    ListAllButton,
    SearchByIdButton,
};
