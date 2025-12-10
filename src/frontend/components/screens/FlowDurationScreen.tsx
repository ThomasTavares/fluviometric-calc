import { JSX, useState, useEffect } from 'react';

import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { LineChart } from '@mui/x-charts/LineChart';

import { ServiceResponse } from '../../../backend/services/streamflow.service';
import { FlowDurationCurveData } from '../../../backend/services/calculations/percentile.service';

function FlowDurationScreen(): JSX.Element {
    const [curveData, setCurveData] = useState<FlowDurationCurveData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [serviceError, setServiceError] = useState<string>('');

    const stationId = sessionStorage.getItem('stationId');
    const startDate = sessionStorage.getItem('startDate');
    const endDate = sessionStorage.getItem('endDate');

    const markPercentiles = [98, 95, 90, 85, 80, 50, 10, 5];

    useEffect(() => {
        if (!stationId || stationId === 'temp') {
            setServiceError('Station ID is missing');
            setLoading(false);
            return;
        }

        const fetchFlowDurationCurve = async () => {
            try {
                setLoading(true);
                setServiceError('');

                const dateRange = (startDate && endDate) ? { startDate, endDate } : undefined;

                const response: ServiceResponse<FlowDurationCurveData> = await window.backendApi.analysis.calculateFlowDurationCurve(stationId, dateRange);

                if (response.success && response.data) {
                    if (!response.data.curve_points || response.data.curve_points.length === 0) {
                        setServiceError('Não há dados fluviométricos disponíveis para esta estação');
                    } else {
                        setCurveData(response.data);
                    }
                } else {
                    setServiceError(response.error || 'Failed to load flow duration curve');
                }
            } catch (error) {
                setServiceError(error instanceof Error ? error.message : 'An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchFlowDurationCurve();
    }, [stationId, startDate, endDate]);

    if (!stationId || stationId === 'temp') {
        return (
            <Alert severity='warning'>
                Station ID is missing
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
            <Alert severity='warning'>
                {serviceError}
                <Box sx={{ mt: 2 }}>
                    <Typography variant='body2'>
                        Esta estação não possui dados fluviométricos no banco de dados. 
                        Você pode sincronizar dados através do menu "Sincronizar Dados".
                    </Typography>
                </Box>
            </Alert>
        );
    }

    if (loading) {
        return <LinearProgress />;
    }

    if (!curveData || curveData.curve_points.length === 0) {
        return <Alert severity='info'>Nenhum dado de vazão disponível</Alert>;
    }

    const xData = curveData.curve_points.map(point => point.percentile);
    const yData = curveData.curve_points.map(point => point.flow_rate);

    return (
        <Paper
            elevation={3}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: 5
            }}
        >
            <LineChart
                xAxis={[{ 
                    label: 'Permanência (%)',
                    data: xData,
                    min: 0,
                    max: 100,
                    valueFormatter: (value: number) => `${value.toFixed(0)}%`
                }]}
                yAxis={[{
                    label: 'Vazão (m³/s)'
                }]}
                series={[{
                    data: yData,
                    label: 'Vazão (m³/s)',
                    curve: 'linear',
                    showMark: (params) => markPercentiles.includes(xData[params.index]) ? true : false
                }]}
                width={1000}
                height={500}
                margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                grid={{ vertical: true, horizontal: true }}
            />
        </Paper>
    );
}

export default FlowDurationScreen;
