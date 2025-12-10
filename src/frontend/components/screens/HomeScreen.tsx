import { JSX, useState, useEffect } from 'react';

import Box from '@mui/material/Box'; 
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';

import { MainScreenProps } from '../../interfaces/main.interface';
import { Station } from '../../../backend/db';
import StationInfoDialog from '../dialogs/StationInfoDialog';

const stationInfoMap: { label: string; key: keyof Station }[] = [
    { label: 'Código', key: 'id' },
    { label: 'Nome', key: 'name' },
    { label: 'Tipo', key: 'type' },
    { label: 'Código Adicional', key: 'additional_code' },
    { label: 'Bacia Hidrográfica', key: 'basin_code' },
    { label: 'Sub Bacia', key: 'sub_basin_code' },
    { label: 'Rio', key: 'river_name' },
    { label: 'Estado', key: 'state_name' },
    { label: 'Município', key: 'city_name' },
    { label: 'Responsável', key: 'responsible_sigla' },
    { label: 'Operadora', key: 'operator_sigla' },
    { label: 'Área Drenagem (m²)', key: 'drainage_area' },
    { label: 'Latitude', key: 'latitude' },
    { label: 'Longitude', key: 'longitude' },
    { label: 'Altitude (m)', key: 'altitude' }
];

function HomeScreen(props: MainScreenProps): JSX.Element {
    const [stationData, setStationData] = useState<Station | null>(
        (props.stationData && props.stationData.id !== 'temp') ? props.stationData : null
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [showEditDialog, setShowEditDialog] = useState<boolean>(false);

    useEffect(() => {
        loadStationData();
    }, []);

    const loadStationData = async () => {
        const stationId = sessionStorage.getItem('stationId');
        
        if (!stationId || stationId === 'temp') {
            setError('Station ID is missing');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await window.backendApi.stations.getById(stationId);
            
            if (result.success && result.data) {
                setStationData(result.data);
            } else {
                setError(result.error || 'Erro ao carregar estação');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setShowEditDialog(true);
    };

    const handleDialogClose = () => {
        setShowEditDialog(false);
    };

    const handleSaved = () => {
        setShowEditDialog(false);
        loadStationData();
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !stationData) {
        return (
            <Alert severity='warning'>
                {error}
                <Box sx={{ mt: 2 }}>
                    <Typography variant='body2'>
                        Esta estação não possui dados fluviométricos no banco de dados. 
                        Você pode sincronizar dados através do menu "Sincronizar Dados".
                    </Typography>
                </Box>
            </Alert>
        );
    }

    return (
        <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
            }}
        >
            <Typography variant='h4'>
                Boas Vindas ao Sistema de Análise Fluviométrica
            </Typography><br/>
            <TableContainer component={Paper} elevation={3} sx={{ maxWidth: '100vh' }}>
                <Table size='small'>
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                                Informações da Estação Selecionada
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stationData ? (
                            stationInfoMap.map((row) => {
                                const value = stationData[row.key];

                                return (
                                    <TableRow key={row.key}>
                                        <TableCell component="th" scope="row" sx={{ width: 180 }}>
                                            {row.label}
                                        </TableCell>
                                        <TableCell>
                                            {value instanceof Date ? value.toLocaleString() : value ?? 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2}>
                                    Nenhuma estação carregada
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {stationData && (
                <Box sx={{ mt: 2 }}>
                    <Button
                        variant='outlined'
                        startIcon={<EditIcon />}
                        onClick={handleEditClick}
                    >
                        Editar Informações da Estação
                    </Button>
                </Box>
            )}

            {stationData && (
                <StationInfoDialog
                    open={showEditDialog}
                    stationCode={stationData.id}
                    initialData={stationData}
                    onClose={handleDialogClose}
                    onSaved={handleSaved}
                />
            )}
        </Box>
    );
}

export default HomeScreen;
