import { JSX, ReactNode } from 'react';

import Box from '@mui/material/Box'; 
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { MainScreenProps } from '../../interfaces/main.interface';
import { Station } from '../../../backend/db';

const stationInfoMap: { label: ReactNode; key: keyof Station }[] = [
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
    { label: <>Área Drenagem (m<sup>2</sup>)</>, key: 'drainage_area' },
    { label: 'Latitude', key: 'latitude' },
    { label: 'Longitude', key: 'longitude' },
    { label: 'Altitude (m)', key: 'altitude' }
];

function HomeScreen(props: MainScreenProps): JSX.Element {
    const { stationData } = props;

    return (
        <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '50vh',
                paddingLeft: 40,
                paddingRight: 40,
            }}
        >
            <Typography variant='h4'>Boas Vindas ao Sistema de Análise Fluviométrica</Typography><br/>
            <TableContainer component={Paper} elevation={3}>
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
        </Box>
    );
}

export default HomeScreen;