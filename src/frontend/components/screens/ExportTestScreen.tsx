import { JSX, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

function ExportTestScreen(): JSX.Element {
    const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
    const [loading, setLoading]   = useState(false);
    const [result, setResult]     = useState<string>('');
    const [error, setError]       = useState<string>('');

    const stationId = sessionStorage.getItem('stationId');

    const handleExport = async () => {
        if (!stationId) {
            setError('Nenhuma estação selecionada na sessão');
            return;
        }

        setLoading(true);
        setResult('');
        setError('');

        try {
            const response = await window.backendApi.exportStations({
                stationIds: [stationId],
                format,
            });

            if (response.success && response.data) {
                setResult(`Arquivo salvo em: ${response.data.savedPaths.join(', ')}`);
            } else {
                setError(response.error ?? 'Erro desconhecido');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao chamar rota de export');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 500 }}>
            <Typography variant="h6" gutterBottom>
                Teste de Export (tela temporária)
            </Typography>

            <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                    Estação: {stationId ?? 'não definida'}
                </Typography>

                <ToggleButtonGroup
                    value={format}
                    exclusive
                    onChange={(_e, val) => { if (val) setFormat(val); }}
                    size="small"
                >
                    <ToggleButton value="csv">CSV</ToggleButton>
                    <ToggleButton value="xlsx">XLSX</ToggleButton>
                </ToggleButtonGroup>

                <Button
                    variant="contained"
                    onClick={handleExport}
                    disabled={loading || !stationId}
                    startIcon={loading ? <CircularProgress size={18} /> : null}
                >
                    {loading ? 'Exportando...' : 'Exportar'}
                </Button>

                {result && <Alert severity="success">{result}</Alert>}
                {error  && <Alert severity="error">{error}</Alert>}
            </Stack>
        </Box>
    );
}

export default ExportTestScreen;