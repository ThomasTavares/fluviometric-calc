import { JSX, useState, useEffect } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';

import { Station } from '../../../backend/db';

interface StationInfoDialogProps {
    open: boolean;
    stationCode: string;
    initialData?: Station;
    onClose: () => void;
    onSaved?: () => void;
}

function StationInfoDialog(props: StationInfoDialogProps): JSX.Element {
    const [name, setName] = useState<string>('');
    const [riverName, setRiverName] = useState<string>('');
    const [stateName, setStateName] = useState<string>('');
    const [cityName, setCityName] = useState<string>('');
    const [basinCode, setBasinCode] = useState<string>('');
    const [subBasinCode, setSubBasinCode] = useState<string>('');
    
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

    useEffect(() => {
        if (props.open && props.initialData) {
            setName(props.initialData.name || '');
            setRiverName(props.initialData.river_name || '');
            setStateName(props.initialData.state_name || '');
            setCityName(props.initialData.city_name || '');
            setBasinCode(props.initialData.basin_code || '');
            setSubBasinCode(props.initialData.sub_basin_code || '');
        } else if (props.open && !props.initialData) {
            setName('');
            setRiverName('');
            setStateName('');
            setCityName('');
            setBasinCode('');
            setSubBasinCode('');
        }
        setError('');
        setSuccess(false);
    }, [props.open, props.initialData]);

    const handleSave = async () => {
        if (!name) {
            setError('Nome da estação é obrigatório');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const updateData = {
                id: props.stationCode,
                name,
                river_name: riverName,
                state_name: stateName,
                city_name: cityName,
                basin_code: basinCode,
                sub_basin_code: subBasinCode,
            };

            const result = await window.backendApi.stations.update(updateData);

            if (result.success) {
                setSuccess(true);
                
                setTimeout(() => {
                    if (props.onSaved) {
                        props.onSaved();
                    }
                    props.onClose();
                }, 1000);
            } else {
                setError(result.error || 'Erro ao salvar informações');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar informações');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSkip = () => {
        props.onClose();
    };

    const isNewStation = !props.initialData;

    return (
        <Dialog open={props.open} onClose={props.onClose} maxWidth='sm' fullWidth>
            <DialogTitle>
                {isNewStation ? 'Completar Informações da Estação' : 'Editar Informações da Estação'}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {error && <Alert severity='error'>{error}</Alert>}
                    {success && <Alert severity='success'>Informações salvas com sucesso!</Alert>}

                    {isNewStation && (
                        <Alert severity='info'>
                            Estação {props.stationCode} foi criada com dados básicos. Preencha as informações adicionais.
                        </Alert>
                    )}

                    <TextField
                        label='Nome da Estação *'
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSaving || success}
                    />

                    <TextField
                        label='Rio'
                        fullWidth
                        value={riverName}
                        onChange={(e) => setRiverName(e.target.value)}
                        disabled={isSaving || success}
                    />

                    <TextField
                        label='Estado'
                        fullWidth
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        disabled={isSaving || success}
                    />

                    <TextField
                        label='Município'
                        fullWidth
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
                        disabled={isSaving || success}
                    />

                    <TextField
                        label='Código da Bacia'
                        fullWidth
                        value={basinCode}
                        onChange={(e) => setBasinCode(e.target.value)}
                        disabled={isSaving || success}
                    />

                    <TextField
                        label='Código da Sub-Bacia'
                        fullWidth
                        value={subBasinCode}
                        onChange={(e) => setSubBasinCode(e.target.value)}
                        disabled={isSaving || success}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                {isNewStation && (
                    <Button onClick={handleSkip} disabled={isSaving || success}>
                        Pular
                    </Button>
                )}
                {!isNewStation && (
                    <Button onClick={props.onClose} disabled={isSaving || success}>
                        Cancelar
                    </Button>
                )}
                <Button
                    onClick={handleSave}
                    variant='contained'
                    disabled={isSaving || success}
                >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default StationInfoDialog;
