import { JSX, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

interface Distribution {
    distribution: string;
    n_events: number;
    ic_upper_95: number;
    event_m3s: number;
    ic_lower_95: number;
    ic_amplitude: number;
}

function Q710ChartScreen(): JSX.Element {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [allDistributions, setAllDistributions] = useState<Distribution[]>([]);
    const [selectedDistributions, setSelectedDistributions] = useState<string[]>([]);
    const [bestDistributionName, setBestDistributionName] = useState<string>('');

    useEffect(() => {
        calculateQ710();
    }, []);

    const calculateQ710 = async () => {
        const stationId = sessionStorage.getItem('stationId');
        const startDate = sessionStorage.getItem('startDate');
        const endDate = sessionStorage.getItem('endDate');

        if (!stationId || stationId === 'temp') {
            setError('ID de estação ausente. Por favor, selecione uma estação válida.');
            return;
        }

        setLoading(true);
        setError(null);

        const dateRangeParam = (startDate || endDate)
            ? { startDate: startDate || undefined, endDate: endDate || undefined }
            : undefined;

        try {
            // @ts-ignore
            const res = await window.backendApi.analysis.calculateQ710(stationId.trim(), dateRangeParam);
            
            if (res.success && res.data) {
                setAllDistributions(res.data.all_distributions || []);
                const bestDist = res.data.best_distribution.distribution;
                setBestDistributionName(bestDist);
                setSelectedDistributions([bestDist]);
            } else {
                setError(res.error || 'Erro desconhecido ao calcular Q7,10.');
            }
        } catch (err) {
            setError('Ocorreu uma exceção ao tentar obter os dados do Q7,10.');
        } finally {
            setLoading(false);
        }
    };

    const toggleDistribution = (distName: string) => {
        setSelectedDistributions((prev) => {
            if (prev.includes(distName)) {
                return prev.filter((d) => d !== distName);
            }
            return [...prev, distName];
        });
    };

    const renderDistributionChart = () => {
        if (selectedDistributions.length === 0) {
            return (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    Nenhuma distribuição selecionada.
                </Alert>
            );
        }

        const width = 1000;
        const height = 600;
        const marginTop = 60;
        const marginRight = 50;
        const marginBottom = 120;
        const marginLeft = 80;
        const chartWidth = width - marginLeft - marginRight;
        const chartHeight = height - marginTop - marginBottom;

        const colors: Record<string, string> = {
            'Normal': '#2196F3',
            'Log-Normal': '#4CAF50',
            'Pearson III': '#FF9800',
            'Log-Pearson III': '#9C27B0',
            'Weibull': '#F44336',
        };

        const selectedData = allDistributions.filter(d => selectedDistributions.includes(d.distribution));
        
        const allFlows = selectedData.flatMap(d => [d.ic_lower_95, d.event_m3s, d.ic_upper_95]);
        const minQ = Math.min(...allFlows);
        const maxQ = Math.max(...allFlows);
        const qRange = maxQ - minQ;
        const padding = qRange * 0.1;

        const yScale = (q: number) => {
            if (qRange === 0) return marginTop + chartHeight / 2;
            return marginTop + chartHeight - ((q - (minQ - padding)) / (qRange + 2 * padding)) * chartHeight;
        };

        const boxWidth = Math.min(80, chartWidth / (selectedData.length * 2));
        const spacing = chartWidth / selectedData.length;

        return (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', maxWidth: width }}>
                    {/* Grid horizontal */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((fraction) => {
                        const q = minQ - padding + (qRange + 2 * padding) * fraction;
                        return (
                            <g key={`grid-q-${fraction}`}>
                                <line x1={marginLeft} y1={yScale(q)} x2={width - marginRight} y2={yScale(q)} stroke="#e0e0e0" strokeWidth="1" />
                                <text x={marginLeft - 10} y={yScale(q)} textAnchor="end" alignmentBaseline="middle" fontSize="11" fill="#666">
                                    {q.toFixed(3)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Eixos */}
                    <line x1={marginLeft} y1={marginTop} x2={marginLeft} y2={height - marginBottom} stroke="#333" strokeWidth="2" />
                    <line x1={marginLeft} y1={height - marginBottom} x2={width - marginRight} y2={height - marginBottom} stroke="#333" strokeWidth="2" />

                    {/* Boxplots */}
                    {selectedData.map((dist, idx) => {
                        const centerX = marginLeft + spacing * (idx + 0.5);
                        const color = colors[dist.distribution] || '#000';
                        const yUpper = yScale(dist.ic_upper_95);
                        const yEvent = yScale(dist.event_m3s);
                        const yLower = yScale(dist.ic_lower_95);

                        return (
                            <g key={dist.distribution}>
                                <line x1={centerX} y1={yUpper} x2={centerX} y2={yLower} stroke={color} strokeWidth="2" />
                                <line x1={centerX - boxWidth / 3} y1={yUpper} x2={centerX + boxWidth / 3} y2={yUpper} stroke={color} strokeWidth="3" />
                                <line x1={centerX - boxWidth / 3} y1={yLower} x2={centerX + boxWidth / 3} y2={yLower} stroke={color} strokeWidth="3" />
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
                                <line x1={centerX - boxWidth / 2} y1={yEvent} x2={centerX + boxWidth / 2} y2={yEvent} stroke="#333" strokeWidth="3" />
                                <text x={centerX} y={yUpper - 15} textAnchor="middle" fontSize="13" fontWeight="bold" fill={color}>
                                    {dist.event_m3s}
                                </text>
                                <text x={centerX + boxWidth / 2.5} y={yUpper + 5} textAnchor="start" fontSize="11" fill="#666">
                                    {dist.ic_upper_95}
                                </text>
                                <text x={centerX + boxWidth / 2.5} y={yLower + 5} textAnchor="start" fontSize="11" fill="#666">
                                    {dist.ic_lower_95}
                                </text>
                                <text x={centerX} y={height - marginBottom + 20} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">
                                    {dist.distribution}
                                </text>
                            </g>
                        );
                    })}

                    <text x={-height / 2} y="20" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333" transform="rotate(-90)">
                        Vazões (m³/s)
                    </text>
                    <text x={width / 2} y="30" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1976D2">
                        Comparação de Vazões Q7,10 por Distribuição
                    </text>

                    {/* Legenda */}
                    <g transform={`translate(${marginLeft}, ${height - marginBottom + 50})`}>
                        <line x1="0" y1="10" x2="20" y2="10" stroke="#333" strokeWidth="2" />
                        <text x="25" y="10" alignmentBaseline="middle" fontSize="11" fill="#333">Limite superior (95%)</text>
                        <rect x="150" y="3" width="20" height="14" fill="#666" fillOpacity="0.6" />
                        <text x="175" y="10" alignmentBaseline="middle" fontSize="11" fill="#333">Eventos (m³/s)</text>
                        <line x1="280" y1="10" x2="300" y2="10" stroke="#333" strokeWidth="3" />
                        <text x="305" y="10" alignmentBaseline="middle" fontSize="11" fill="#333">Limite inferior (95%)</text>
                    </g>
                </svg>

                <Paper sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5' }} elevation={0}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>📊 Interpretação:</strong> Este boxplot mostra a vazão Q7,10 estimada (linha central) e seus
                        intervalos de confiança de 95% (superior e inferior) para cada distribuição probabilística testada.
                        A caixa representa a faixa de incerteza da estimativa.
                    </Typography>
                </Paper>
            </Box>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>Calculando Q7,10...</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    A testar distribuições probabilísticas e a processar dados.
                </Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant='h6' gutterBottom>
                    Selecione as distribuições para visualizar:
                </Typography>
                <FormGroup row>
                    {allDistributions.map((dist) => (
                        <FormControlLabel
                            key={dist.distribution}
                            control={
                                <Checkbox 
                                    checked={selectedDistributions.includes(dist.distribution)}
                                    onChange={() => toggleDistribution(dist.distribution)}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2" fontWeight={selectedDistributions.includes(dist.distribution) ? 'bold' : 'normal'}>
                                    {dist.distribution === bestDistributionName && "★ "}
                                    {dist.distribution}
                                </Typography>
                            }
                        />
                    ))}
                </FormGroup>
            </Box>

            {allDistributions.length > 0 && renderDistributionChart()}
        </Paper>
    );
}

export default Q710ChartScreen;