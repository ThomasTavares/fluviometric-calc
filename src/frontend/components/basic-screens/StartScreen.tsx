import { JSX, useState } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';

import { StartScreenProps } from '../../interfaces/start.interface';
import { validateStationCode } from '../../services/station.api';

function StartScreen(props: StartScreenProps): JSX.Element {
    const [stationCode, setStationCode] = useState<string>('');
    const [isValidating, setIsValidating] = useState<boolean>(false);
    const [validationError, setValidationError] = useState<string>('');
    const [stationName, setStationName] = useState<string>('');

    const handleStart = async () => {
        setIsValidating(true);
        setValidationError('');

        const validation = await validateStationCode(stationCode);

        setIsValidating(false);

        if (!validation.success) {
            setValidationError(validation.error || 'Erro ao validar estação');
            return;
        } else if (!validation.exists) {
            setValidationError('Estação não encontrada no banco de dados');
            return;
        }

        const stationData = validation.data!;
        setStationName(stationData.name || '');

        console.log('Starting with the following data:');
        console.log('Station Code:', stationData.id);
        console.log('Station Name:', stationData.name);

        props.onInit({
            id: stationData.id,
            name: stationData.name,
            type: stationData.type,
            additional_code: stationData.additional_code || null,
            basin_code: stationData.basin_code,
            sub_basin_code: stationData.sub_basin_code,
            river_name: stationData.river_name,
            state_name: stationData.state_name,
            city_name: stationData.city_name,
            responsible_sigla: stationData.responsible_sigla,
            operator_sigla: stationData.operator_sigla,
            drainage_area: stationData.drainage_area || null,
            latitude: stationData.latitude || null,
            longitude: stationData.longitude || null,
            altitude: stationData.altitude || null,
            created_at: stationData.created_at
        });
    };

    /* const handleSyncMode = () => {
        if (props.onSyncMode) {
            props.onSyncMode();
        }
    }; */

    return (
        <Box sx={{ 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
        }}>
            <Paper
                elevation={3}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 3,
                    maxWidth: 600,
                }}
            >
                <Typography variant='h4' gutterBottom>
                    Sistema de Análise Fluviométrica
                </Typography>

                <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                    Selecione uma estação existente ou sincronize uma nova
                </Typography>

                <Stack spacing={3} sx={{ width: '100%', maxWidth: 400 }}>
                    {validationError && (
                        <Alert severity='error'>{validationError}</Alert>
                    )}
                    
                    {stationName && (
                        <Alert severity='success'>
                            Estação encontrada: {stationName}
                        </Alert>
                    )}

                    <TextField
                        label='Código da Estação'
                        type='text'
                        variant='outlined'
                        required
                        fullWidth
                        value={stationCode}
                        onChange={(e) => {
                            setStationCode(e.target.value);
                            setValidationError('');
                            setStationName('');
                        }}
                        placeholder='Ex: 70100000'
                    />

                    <Button 
                        variant='contained'
                        size='large'
                        onClick={handleStart}
                        disabled={!stationCode || isValidating}
                        startIcon={isValidating ? <CircularProgress size={20} /> : null}
                    >{isValidating ? 'Validando...' : 'Acessar Sistema'}</Button>

                    <Divider>
                        <Typography variant='caption' color='text.secondary'>
                            OU
                        </Typography>
                    </Divider>

                    <Button
                        variant='outlined'
                        size='large'
                        onClick={props.onSync}
                        startIcon={<SyncRoundedIcon />}
                        disabled={isValidating}
                    >
                        Sincronizar Estação
                    </Button>

                    <Alert severity='info' sx={{ mt: 2 }}>
                        <Typography variant='caption'>
                            Use "Sincronizar Estação" para adicionar dados de uma estação que ainda não está no sistema,
                            ou atualizar os dados de uma estação cadastrada.
                        </Typography>
                    </Alert>
                </Stack>
            </Paper>
        </Box>
    );
}

export default StartScreen;
