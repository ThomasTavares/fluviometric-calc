import { JSX, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

import { getAvailableDateRange, getNullFlowsSummary, DateRangeInfo, NullFlowsSummary } from '../../services/streamflow.api';

function PreProcessingScreen(): JSX.Element {
    const [dateRange, setDateRange] = useState<DateRangeInfo | null>(null);
    const [summary, setSummary] = useState<NullFlowsSummary | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isApplying, setIsApplying] = useState<boolean>(false);

    const stationId = sessionStorage.getItem('stationId');

    useEffect(() => {
        if (!stationId) {
            setError('Station ID is missing');
            setLoading(false);
            return;
        }

        loadData();
    }, [stationId]);

    const formatDateLocal = (dateString: string): string => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const loadData = async () => {
        if (!stationId) return;

        setLoading(true);
        setError('');

        try {
            const rangeResponse = await getAvailableDateRange(stationId);
            if (rangeResponse.success && rangeResponse.data) {
                setDateRange(rangeResponse.data);
                
                const savedStartDate = sessionStorage.getItem('startDate');
                const savedEndDate = sessionStorage.getItem('endDate');
                
                setStartDate(savedStartDate || rangeResponse.data.min_date);
                setEndDate(savedEndDate || rangeResponse.data.max_date);
            } else {
                setError(rangeResponse.error || 'Failed to load date range');
                return;
            }

            const summaryResponse = await getNullFlowsSummary(
                stationId,
                sessionStorage.getItem('startDate') || undefined,
                sessionStorage.getItem('endDate') || undefined
            );
            
            if (summaryResponse.success && summaryResponse.data) {
                setSummary(summaryResponse.data);
            } else {
                setError(summaryResponse.error || 'Failed to load summary');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unexpected error');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!startDate || !endDate) {
            setError('Selecione o intervalo de datas');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError('Data inicial deve ser menor que data final');
            return;
        }

        if (dateRange) {
            const selectedStart = new Date(startDate);
            const selectedEnd = new Date(endDate);
            const availableStart = new Date(dateRange.min_date);
            const availableEnd = new Date(dateRange.max_date);

            if (selectedStart < availableStart || selectedEnd > availableEnd) {
                const formattedMin = formatDateLocal(dateRange.min_date);
                const formattedMax = formatDateLocal(dateRange.max_date);
                setError(`Não há dados disponíveis fora do período ${formattedMin} até ${formattedMax}`);
                return;
            }

            if (selectedStart < availableStart) {
                const formattedMin = formatDateLocal(dateRange.min_date);
                setError(`Data inicial anterior ao início dos dados disponíveis (${formattedMin})`);
                return;
            }

            if (selectedEnd > availableEnd) {
                const formattedMax = formatDateLocal(dateRange.max_date);
                setError(`Data final posterior ao fim dos dados disponíveis (${formattedMax})`);
                return;
            }
        }

        setIsApplying(true);
        setError('');

        try {
            sessionStorage.setItem('startDate', startDate);
            sessionStorage.setItem('endDate', endDate);

            const summaryResponse = await getNullFlowsSummary(stationId!, startDate, endDate);
            if (summaryResponse.success && summaryResponse.data) {
                setSummary(summaryResponse.data);
                setError('');
            } else {
                setError(summaryResponse.error || 'Failed to update summary');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unexpected error');
        } finally {
            setIsApplying(false);
        }
    };

    const handleReset = () => {
        sessionStorage.removeItem('startDate');
        sessionStorage.removeItem('endDate');
        
        if (dateRange) {
            setStartDate(dateRange.min_date);
            setEndDate(dateRange.max_date);
        }
        
        loadData();
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !summary) {
        return <Alert severity='error'>{error}</Alert>;
    }

    return (
        <Stack spacing={3}>
            {error && <Alert severity='error'>{error}</Alert>}

            {dateRange && (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant='h6' gutterBottom>
                        Período Disponível
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography variant='body2' color='text.secondary'>
                                Data Inicial
                            </Typography>
                            <Typography variant='body1'>
                                {formatDateLocal(dateRange.min_date)}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography variant='body2' color='text.secondary'>
                                Data Final
                            </Typography>
                            <Typography variant='body1'>
                                {formatDateLocal(dateRange.max_date)}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography variant='body2' color='text.secondary'>
                                Total de Registros
                            </Typography>
                            <Typography variant='body1'>
                                {dateRange.total_records.toLocaleString('pt-BR')}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            )}

            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant='h6' gutterBottom>
                    Selecionar Intervalo de Análise
                </Typography>
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                            <TextField
                                label='Data Inicial'
                                type='date'
                                fullWidth
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: dateRange?.min_date,
                                    max: dateRange?.max_date
                                }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 250 }}>
                            <TextField
                                label='Data Final'
                                type='date'
                                fullWidth
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                    min: dateRange?.min_date,
                                    max: dateRange?.max_date
                                }}
                            />
                        </Box>
                    </Box>
                    <Stack direction='row' spacing={2}>
                        <Button
                            variant='contained'
                            onClick={handleApply}
                            disabled={isApplying}
                            startIcon={isApplying ? <CircularProgress size={20} /> : null}
                        >
                            {isApplying ? 'Aplicando...' : 'Aplicar Filtro'}
                        </Button>
                        <Button
                            variant='outlined'
                            onClick={handleReset}
                            disabled={isApplying}
                        >
                            Resetar
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {summary && (
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant='h6' gutterBottom>
                        Análise de Falhas
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography variant='body2' color='text.secondary'>
                                Total de Registros
                            </Typography>
                            <Typography variant='h5'>
                                {summary.total_records.toLocaleString('pt-BR')}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography variant='body2' color='text.secondary'>
                                Dados Válidos
                            </Typography>
                            <Typography variant='h5' color='success.main'>
                                {summary.valid_count.toLocaleString('pt-BR')}
                            </Typography>
                            <Chip
                                label={`${summary.completeness_percentage.toFixed(1)}%`}
                                color='success'
                                size='small'
                                sx={{ mt: 1 }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography variant='body2' color='text.secondary'>
                                Dados Nulos
                            </Typography>
                            <Typography variant='h5' color='error.main'>
                                {summary.null_count.toLocaleString('pt-BR')}
                            </Typography>
                            <Chip
                                label={`${((summary.null_count / summary.total_records) * 100).toFixed(1)}%`}
                                color='error'
                                size='small'
                                sx={{ mt: 1 }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                            <Typography variant='body2' color='text.secondary'>
                                Dados Zerados
                            </Typography>
                            <Typography variant='h5' color='warning.main'>
                                {summary.zero_count.toLocaleString('pt-BR')}
                            </Typography>
                            <Chip
                                label={`${((summary.zero_count / summary.total_records) * 100).toFixed(1)}%`}
                                color='warning'
                                size='small'
                                sx={{ mt: 1 }}
                            />
                        </Box>
                    </Box>
                </Paper>
            )}
        </Stack>
    );
}

export default PreProcessingScreen;
