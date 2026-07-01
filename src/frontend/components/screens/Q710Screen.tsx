import { JSX, useState, useEffect } from 'react';

import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';

interface Q710Distribution {
    distribution: string;
    n_events: number;
    ic_upper_95: number;
    event_m3s: number;
    ic_lower_95: number;
    ic_amplitude: number;
    std_error: number;
    mean: number;
    variance: number | null;
    skewness: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
    k_factor: number;
    A: number;
}

interface Q710Data {
    station_id: string;
    n_years: number;
    start_date: string;
    end_date: string;
    n_zeros: number;
    best_distribution: Q710Distribution;
    all_distributions: Q710Distribution[];
    notes: string;
    method_reference: string;
    q7_values: number[];
}

interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

function Q710Screen(): JSX.Element {
    const [q710Data, setQ710Data] = useState<Q710Data | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [serviceError, setServiceError] = useState<string>('');

    const stationId = sessionStorage.getItem('stationId');
    const startDate = sessionStorage.getItem('startDate');
    const endDate = sessionStorage.getItem('endDate');

    useEffect(() => {
        if (!stationId || stationId === 'temp') {
            setServiceError('Station ID is missing');
            setLoading(false);
            return;
        }

        const fetchQ710 = async () => {
            try {
                setLoading(true);
                setServiceError('');

                const dateRange = (startDate && endDate) ? { startDate, endDate } : undefined;

                const response: ServiceResponse<Q710Data> = await window.backendApi.analysis.calculateQ710(stationId, dateRange);

                if (response.success && response.data) {
                    setQ710Data(response.data);
                } else {
                    setServiceError(response.error || 'Falha ao calcular Q7,10');
                }
            } catch (error) {
                setServiceError(error instanceof Error ? error.message : 'Ocorreu um erro inesperado');
            } finally {
                setLoading(false);
            }
        };

        fetchQ710();
    }, [stationId, startDate, endDate]);

    if (!stationId || stationId === 'temp') {
        return (
            <Alert severity='warning'>
                ID da Estação não encontrado.
                <Box sx={{ mt: 2 }}>
                    <Typography variant='body2'>
                        Esta estação não possui dados fluviométricos no banco de dados. 
                        Você pode sincronizar dados através do menu "Sincronizar Dados".
                    </Typography>
                </Box>
            </Alert>
        );
    }

    if (serviceError && !loading) {
        return (
            <Alert severity='error'>
                {serviceError}
            </Alert>
        );
    }

    if (loading) {
        return (
            <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Processando série histórica e testando distribuições probabilísticas...
                </Typography>
            </Box>
        );
    }

    if (!q710Data) {
        return <Alert severity='info'>Nenhum dado Q7,10 disponível</Alert>;
    }

    const { best_distribution, all_distributions } = q710Data;
    const isGammaValid = best_distribution.skewness >= -1.02 && best_distribution.skewness <= 2.0;
    const stdDev = best_distribution.variance ? Math.sqrt(best_distribution.variance) : null;
    const isLogBased = best_distribution.distribution === 'Log-Pearson III' || best_distribution.distribution === 'Log-Normal';

    return (
        <Paper
            elevation={3}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                p: 3,
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}
        >
            <Typography variant="h5" color="primary" gutterBottom fontWeight="bold">
                Resultado Q7,10 - Estação {q710Data.station_id}
            </Typography>

            {/* Top KPIs (Cards) */}
            <Grid container spacing={2} sx={{ mb: 2, flexShrink: 0 }}>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', height: '100%' }}>
                        <CardContent>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Vazão Q7,10</Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {best_distribution.event_m3s} <Typography component="span" variant="h6">m³/s</Typography>
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Distribuição Selecionada</Typography>
                            <Typography variant="h6" fontWeight="bold" color="primary">
                                {best_distribution.distribution}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Menor amplitude de IC
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Intervalo de Confiança 95%</Typography>
                            <Typography variant="h6" fontWeight="bold">
                                [{best_distribution.ic_lower_95} , {best_distribution.ic_upper_95}]
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Amplitude: {best_distribution.ic_amplitude.toFixed(4)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary">Série Temporal</Typography>
                            <Typography variant="h6" fontWeight="bold">
                                {q710Data.n_years} anos
                            </Typography>
                            <Chip 
                                size="small" 
                                color={q710Data.n_years >= 30 ? "success" : q710Data.n_years >= 15 ? "warning" : "error"}
                                label={q710Data.n_years >= 30 ? "Boa representatividade" : q710Data.n_years >= 15 ? "Adequado" : "Série curta"} 
                                sx={{ mt: 1 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Aviso Gama e Período */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexShrink: 0 }}>
                <Alert severity={isGammaValid ? "success" : "warning"} sx={{ flexGrow: 1, py: 0 }}>
                    {isGammaValid ? "✓ Assimetria dentro da faixa válida" : "⚠ Assimetria fora da faixa válida"}
                    {' - '} {q710Data.notes}
                </Alert>
                <Alert severity="info" sx={{ py: 0 }}>
                    <strong>Período:</strong> {q710Data.start_date} até {q710Data.end_date}
                    {q710Data.n_zeros > 0 && ` (${q710Data.n_zeros} dias zerados ignorados)`}
                </Alert>
            </Box>

            {/* Fórmula Aplicada (faixa compacta, uma linha, com scroll horizontal se necessário) */}
            <Box
                sx={{
                    mb: 2,
                    px: 1.5,
                    py: 0.5,
                    flexShrink: 0,
                    borderRadius: 1,
                    bgcolor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    overflowX: 'auto',
                    whiteSpace: 'nowrap'
                }}
            >
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ flexShrink: 0 }}>
                    📐 Fórmula ({best_distribution.distribution}):
                </Typography>
                {stdDev !== null ? (
                    isLogBased ? (
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                            ln(Q<sub>7,10</sub>) = µ<sub>ln</sub> + K·σ<sub>ln</sub> = {best_distribution.mean.toFixed(4)} + ({best_distribution.k_factor}) × {stdDev.toFixed(4)} → Q<sub>7,10</sub> = <strong>{best_distribution.event_m3s} m³/s</strong>
                        </Typography>
                    ) : (
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                            Q<sub>7,10</sub> = µ + K·σ = {best_distribution.mean} + ({best_distribution.k_factor}) × {stdDev.toFixed(4)} = <strong>{best_distribution.event_m3s} m³/s</strong>
                        </Typography>
                    )
                ) : (
                    <Typography variant="caption" color="text.secondary">Dados insuficientes para exibir a fórmula</Typography>
                )}
            </Box>

            {/* Área Dividida Inferior (Tabelas com Scroll Interno) */}
            <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
                
                {/* Coluna 1: Estatísticas */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Estatísticas da Série Q7
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Estatística</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Interpretação</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell variant="head">Média (µ)</TableCell>
                                    <TableCell align="right">{best_distribution.mean} m³/s</TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            Valor médio das mínimas anuais de 7 dias
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell variant="head">Desvio Padrão (σ)</TableCell>
                                    <TableCell align="right">
                                        {best_distribution.variance ? Math.sqrt(best_distribution.variance).toFixed(4) : "N/A"} m³/s
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            Dispersão dos dados em torno da média
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                                <TableRow selected={!isGammaValid}>
                                    <TableCell variant="head">Assimetria (γ)</TableCell>
                                    <TableCell align="right" sx={{ color: isGammaValid ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                                        {best_distribution.skewness}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: isGammaValid ? 'success.main' : 'error.main' }}>
                                            {isGammaValid ? "✓ Dentro da faixa válida [-1.02, 2.00]" : "⚠ Fora da faixa válida"}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell variant="head">Alfa (α)</TableCell>
                                    <TableCell align="right">{best_distribution.alpha || "N/A"}</TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            Forma da distribuição (α = 4/γ²)
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell variant="head">Beta (β)</TableCell>
                                    <TableCell align="right">{best_distribution.beta || "N/A"}</TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            Escala da distribuição (β = σ|γ|/2)
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell variant="head">Fator K</TableCell>
                                    <TableCell align="right">{best_distribution.k_factor}</TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            Fator de frequência para T=10 anos
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell variant="head">Erro Padrão</TableCell>
                                    <TableCell align="right">{best_distribution.std_error}</TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color="text.secondary">
                                            Incerteza associada à estimativa do parâmetro
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* Coluna 2: Comparação de Distribuições */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Comparação de Distribuições
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Distribuição</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Evento (m³/s)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>IC 95%</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amplitude IC</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {all_distributions
                                    .sort((a, b) => a.ic_amplitude - b.ic_amplitude)
                                    .map((dist, idx) => {
                                        const isBest = dist.distribution === best_distribution.distribution;
                                        return (
                                            <TableRow key={dist.distribution} sx={{ bgcolor: isBest ? 'action.selected' : 'inherit' }}>
                                                <TableCell>
                                                    {isBest && "★ "} {dist.distribution}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: isBest ? 'bold' : 'normal' }}>
                                                    {dist.event_m3s}
                                                </TableCell>
                                                <TableCell align="right">
                                                    [{dist.ic_lower_95} , {dist.ic_upper_95}]
                                                </TableCell>
                                                <TableCell align="right">
                                                    {dist.ic_amplitude}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {idx === 0 ? (
                                                        <Typography variant="caption" color="success.main" fontWeight="bold">Melhor Ajuste</Typography>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {(((dist.ic_amplitude / all_distributions[0].ic_amplitude) - 1) * 100).toFixed(1)}% maior
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                
            </Grid>
        </Paper>
    );
}

export default Q710Screen;