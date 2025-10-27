import { JSX, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { StartScreenProps } from '../../interfaces/StartInterface';
import { validateStationCode } from '../../services/station.api';

function StartScreen(props: StartScreenProps): JSX.Element {
    const [stationCode, setStationCode] = useState<string>('');
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [isValidating, setIsValidating] = useState<boolean>(false);
    const [validationError, setValidationError] = useState<string>('');
    const [stationName, setStationName] = useState<string>('');

    const currentYear = dayjs();

    const handleStart = async () => {

        const isDateRangeValid = startDate && endDate && startDate.isBefore(endDate);
        if (!isDateRangeValid) {
            setValidationError('Intervalo de datas inválido');
            return;
        }

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

        setStationName(validation.stationName || '');

        console.log('Starting with the following data:');
        console.log('Station Code:', stationCode);
        console.log('Station Name:', stationName);
        console.log('Start Date:', startDate ? startDate.format('DD-MM-YYYY') : null);
        console.log('End Date:', endDate ? endDate.format('DD-MM-YYYY') : null);

        props.onInit({
            stationCode: stationCode,
            stationName: stationName,
            startDate: startDate.format('DD-MM-YYYY'),
            endDate: endDate.format('DD-MM-YYYY'),
        });
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 3,
            }}>
                <Typography variant='h4' gutterBottom>
                    Insira as Informações da Estação
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
                    />

                    <DatePicker
                        label='Data Inicial'
                        maxDate={currentYear}
                        format='DD/MM/YYYY'
                        yearsOrder='desc'
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                    />

                    <DatePicker
                        label='Data Final'
                        maxDate={currentYear}
                        format='DD/MM/YYYY'
                        yearsOrder='desc'
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                    />

                    <Button 
                        variant='contained'
                        size='large'
                        onClick={handleStart}
                        disabled={!stationCode || !startDate || !endDate || isValidating}
                        startIcon={isValidating ? <CircularProgress size={20} /> : null}
                    >{isValidating ? 'Validando...' : 'Confirmar'}</Button>
                </Stack>
            </Box>
        </LocalizationProvider>
    );
}

export default StartScreen;