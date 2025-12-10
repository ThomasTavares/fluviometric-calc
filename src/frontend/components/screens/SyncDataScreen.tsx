import { JSX, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ClearIcon from '@mui/icons-material/Clear';

import StationInfoDialog from '../dialogs/StationInfoDialog';

interface SyncProgress {
    windowsCompleted: number;
    totalWindows: number;
    currentWindow: string;
    recordsInserted: number;
    recordsUpdated: number;
}

interface SyncResult {
    success: boolean;
    cancelled: boolean;
    stationId: string;
    stationCreated: boolean;
    period: { start: string; end: string };
    windows: { total: number; completed: number; failed: number };
    records: { inserted: number; updated: number };
    duration: number;
    errors: Array<{ window: string; message: string }>;
}

function SyncDataScreen(): JSX.Element {
    const [cpf, setCpf] = useState<string>('');
    const [senha, setSenha] = useState<string>('');
    const [stationCode, setStationCode] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('1900-01-01');
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [progress, setProgress] = useState<SyncProgress | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [result, setResult] = useState<SyncResult | null>(null);

    const [showStationDialog, setShowStationDialog] = useState<boolean>(false);
    const [hasStoredCredentials, setHasStoredCredentials] = useState<boolean>(false);

    useEffect(() => {
        loadStoredCredentials();

        window.backendApi.sync.onProgress((progressData: SyncProgress) => {
            setProgress(progressData);
            
            const timestamp = new Date().toLocaleTimeString('pt-BR');
            const logMessage = `[${timestamp}] ${progressData.currentWindow}: ${progressData.recordsInserted} inseridos, ${progressData.recordsUpdated} atualizados`;
            
            setLogs(prevLogs => [...prevLogs, logMessage]);
        });

        return () => {
            window.backendApi.sync.removeProgressListener();
        };
    }, []);

    const loadStoredCredentials = () => {
        const storedCpf = sessionStorage.getItem('anaCpf');
        const storedSenha = sessionStorage.getItem('anaSenha');

        if (storedCpf && storedSenha) {
            setCpf(storedCpf);
            setSenha(storedSenha);
            setHasStoredCredentials(true);
        }
    };

    const saveCredentials = () => {
        sessionStorage.setItem('anaCpf', cpf);
        sessionStorage.setItem('anaSenha', senha);
        setHasStoredCredentials(true);
    };

    const clearCredentials = () => {
        sessionStorage.removeItem('anaCpf');
        sessionStorage.removeItem('anaSenha');
        setCpf('');
        setSenha('');
        setHasStoredCredentials(false);
    };

    const handleSync = async () => {
        if (!cpf || !senha || !stationCode || !startDate || !endDate) {
            setError('Todos os campos são obrigatórios');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError('Data inicial deve ser anterior à data final');
            return;
        }

        setIsSyncing(true);
        setError('');
        setProgress(null);
        setLogs([]);
        setResult(null);

        sessionStorage.setItem('stationId', stationCode);

        try {
            const syncResult = await window.backendApi.sync.execute({
                cpf,
                senha,
                stationCode,
                startDate,
                endDate,
            });

            setResult(syncResult);

            if (syncResult.success) {
                saveCredentials();
                
                sessionStorage.removeItem('startDate');
                sessionStorage.removeItem('endDate');
                
                if (syncResult.stationCreated) {
                    setShowStationDialog(true);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao sincronizar dados');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCancel = async () => {
        await window.backendApi.sync.cancel();
        setIsSyncing(false);
    };

    const handleReset = () => {
        setProgress(null);
        setLogs([]);
        setResult(null);
        setError('');
    };

    const progressPercent = progress ? (progress.windowsCompleted / progress.totalWindows) * 100 : 0;

    return (
        <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant='h5'>
                            Sincronizar Dados da ANA
                        </Typography>
                        {hasStoredCredentials && (
                            <Tooltip title='Limpar credenciais salvas'>
                                <IconButton onClick={clearCredentials} size='small' color='error'>
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                        Sincronize dados fluviométricos diretamente da API da ANA
                    </Typography>

                    {hasStoredCredentials && (
                        <Alert severity='info' sx={{ mb: 2 }}>
                            Credenciais da ANA carregadas automaticamente
                        </Alert>
                    )}

                    {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: 1, minWidth: 250 }}>
                                <TextField
                                    label='CPF'
                                    fullWidth
                                    value={cpf}
                                    onChange={(e) => setCpf(e.target.value)}
                                    disabled={isSyncing}
                                    placeholder='000.000.000-00'
                                />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 250 }}>
                                <TextField
                                    label='Senha'
                                    type='password'
                                    fullWidth
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    disabled={isSyncing}
                                />
                            </Box>
                        </Box>

                        <TextField
                            label='Código da Estação'
                            fullWidth
                            value={stationCode}
                            onChange={(e) => setStationCode(e.target.value)}
                            disabled={isSyncing}
                            placeholder='Ex: 70100000'
                        />

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Box sx={{ flex: 1, minWidth: 250 }}>
                                <TextField
                                    label='Data Inicial'
                                    type='date'
                                    fullWidth
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    disabled={isSyncing}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 250 }}>
                                <TextField
                                    label='Data Final'
                                    type='date'
                                    fullWidth
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    disabled={isSyncing}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>
                        </Box>

                        {!isSyncing && !result && (
                            <Button
                                variant='contained'
                                size='large'
                                onClick={handleSync}
                                disabled={!cpf || !senha || !stationCode}
                            >
                                Iniciar Sincronização
                            </Button>
                        )}

                        {isSyncing && (
                            <Button
                                variant='outlined'
                                color='error'
                                onClick={handleCancel}
                            >
                                Cancelar Sincronização
                            </Button>
                        )}

                        {result && !isSyncing && (
                            <Button
                                variant='outlined'
                                onClick={handleReset}
                            >
                                Nova Sincronização
                            </Button>
                        )}
                    </Stack>
                </Paper>

                {isSyncing && progress && (
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant='h6' gutterBottom>
                            Progresso da Sincronização
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant='body2' color='text.secondary'>
                                    {progress.windowsCompleted} de {progress.totalWindows} janelas processadas
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    {progressPercent.toFixed(0)}%
                                </Typography>
                            </Box>
                            <LinearProgress variant='determinate' value={progressPercent} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Janela Atual
                                </Typography>
                                <Typography variant='body1'>
                                    {progress.currentWindow}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Registros Inseridos
                                </Typography>
                                <Typography variant='body1' color='primary.main'>
                                    {progress.recordsInserted.toLocaleString('pt-BR')}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Registros Atualizados
                                </Typography>
                                <Typography variant='body1' color='secondary.main'>
                                    {progress.recordsUpdated.toLocaleString('pt-BR')}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant='subtitle2' gutterBottom>
                            Log de Progresso
                        </Typography>
                        <Paper variant='outlined' sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
                            <List dense disablePadding>
                                {logs.map((log, index) => (
                                    <ListItem key={index} disablePadding>
                                        <ListItemText
                                            primary={log}
                                            primaryTypographyProps={{
                                                variant: 'body2',
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem'
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>

                        <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                            Tempo estimado: 1-2 minutos para períodos longos
                        </Typography>
                    </Paper>
                )}

                {result && !isSyncing && (
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Typography variant='h6' gutterBottom>
                            Resultado da Sincronização
                        </Typography>

                        {result.success ? (
                            <Alert severity='success' sx={{ mb: 2 }}>
                                Sincronização concluída com sucesso!
                            </Alert>
                        ) : result.cancelled ? (
                            <Alert severity='warning' sx={{ mb: 2 }}>
                                Sincronização cancelada pelo usuário
                            </Alert>
                        ) : (
                            <Alert severity='error' sx={{ mb: 2 }}>
                                Sincronização falhou
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Estação
                                </Typography>
                                <Typography variant='body1'>
                                    {result.stationId}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Período
                                </Typography>
                                <Typography variant='body1'>
                                    {new Date(result.period.start).toLocaleDateString('pt-BR')} - {new Date(result.period.end).toLocaleDateString('pt-BR')}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Duração
                                </Typography>
                                <Typography variant='body1'>
                                    {(result.duration / 1000).toFixed(1)}s
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Janelas Processadas
                                </Typography>
                                <Typography variant='h6'>
                                    {result.windows.completed} / {result.windows.total}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Registros Inseridos
                                </Typography>
                                <Typography variant='h6' color='primary.main'>
                                    {result.records.inserted.toLocaleString('pt-BR')}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Registros Atualizados
                                </Typography>
                                <Typography variant='h6' color='secondary.main'>
                                    {result.records.updated.toLocaleString('pt-BR')}
                                </Typography>
                            </Box>
                        </Box>

                        {result.errors.length > 0 && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant='subtitle2' gutterBottom color='error'>
                                    Erros ({result.errors.length})
                                </Typography>
                                <Paper variant='outlined' sx={{ maxHeight: 150, overflow: 'auto', p: 1 }}>
                                    <List dense>
                                        {result.errors.map((err, index) => (
                                            <ListItem key={index}>
                                                <ListItemText
                                                    primary={err.window}
                                                    secondary={err.message}
                                                    secondaryTypographyProps={{ color: 'error' }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            </>
                        )}

                        {result.stationCreated && (
                            <Alert severity='info' sx={{ mt: 2 }}>
                                Estação {result.stationId} criada com dados básicos.
                                <Button
                                    size='small'
                                    onClick={() => setShowStationDialog(true)}
                                    sx={{ ml: 2 }}
                                >
                                    Completar Informações
                                </Button>
                            </Alert>
                        )}
                    </Paper>
                )}
            </Stack>

            {result && (
                <StationInfoDialog
                    open={showStationDialog}
                    stationCode={result.stationId}
                    onClose={() => setShowStationDialog(false)}
                    onSaved={() => setShowStationDialog(false)}
                />
            )}
        </Box>
    );
}

export default SyncDataScreen;
