import { JSX, useState, useEffect } from 'react';

import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TablePagination from '@mui/material/TablePagination';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { ServiceResponse, DailyFlowsRow } from '../../../backend/services/streamflow.service';

function StreamflowScreen(): JSX.Element {
    const [isImporting, setIsImporting] = useState<boolean>(false);
    const [importError, setImportError] = useState<string>('');
    const [streamflowData, setStreamflowData] = useState<DailyFlowsRow[]>([]);
    const [tablePage, setTablePage] = useState<number>(0);

    const stationId = sessionStorage.getItem('stationId');
    const startDate = sessionStorage.getItem('startDate');
    const endDate = sessionStorage.getItem('endDate');

    useEffect(() => {
        if (!stationId || stationId === 'temp') {
            setImportError('Station ID is missing');
            return;
        }
        handleImport();
    }, []);

    const handleImport = async () => {
        if (!stationId) return;

        console.log('Importing streamflow data for station: ', stationId);
        setIsImporting(true);
        setImportError('');

        try {
            const response: ServiceResponse<DailyFlowsRow[]> = await window.backendApi.streamflow.getForExport(
                stationId,
                startDate || undefined,
                endDate || undefined
            );
            if (response.success && response.data) {
                if (response.data.length === 0) {
                    setImportError('Não há dados fluviométricos disponíveis para esta estação');
                } else {
                    setStreamflowData(response.data);
                    console.log('Imported streamflow data successfully.');
                }
            } else {
                setImportError(response.error || 'Failed to import streamflow data.');
                console.error('Import error:', response.error);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            setImportError(errorMessage);
            console.error('Import exception:', errorMessage);
        } finally {
            setIsImporting(false);
        }
    };

    const handleChangeTablePage = (_event: unknown, newPage: number) => {
        setTablePage(newPage);
    };

    const rowsPerPage = 24;

    const dayHeaders: number[] = [];
    for (let i = 1; i <= 31; i++) dayHeaders.push(i);

    const paginatedData = streamflowData.slice(
        tablePage * rowsPerPage,
        tablePage * rowsPerPage + rowsPerPage
    );

    // Mostra aviso se não houver stationId ou se for estação temporária
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

    // Mostra aviso se houver erro ao carregar dados
    if (importError && !isImporting) {
        return (
            <Alert severity='warning'>
                {importError}
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
        <Paper
            elevation={3}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {isImporting && <LinearProgress />}

            {paginatedData.length === 0 && !isImporting && (
                <Alert severity='info' sx={{ m: 2 }}>Nenhum dado de vazão disponível</Alert>
            )}

            <TableContainer
                sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    maxHeight: '80vh',
                    borderRadius: 1
                }}
            >
                <Table size='small' stickyHeader sx={{ display: (isImporting || paginatedData.length === 0) ? 'none' : '' }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{
                                fontWeight: 'bold',
                                position: 'sticky',
                                left: 0,
                                backgroundColor: 'background.paper',
                                zIndex: 2
                            }}>
                                Ano
                            </TableCell>
                            <TableCell sx={{
                                fontWeight: 'bold',
                                position: 'sticky',
                                alignItems: 'center',
                                left: 64,
                                backgroundColor: 'background.paper',
                                zIndex: 2
                            }}>
                                Mês
                            </TableCell>
                            {dayHeaders.map((day) => (
                                <TableCell
                                    key={day}
                                    align='center'
                                    sx={{
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                        zIndex: 0
                                    }}
                                >
                                    Dia {day}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((row, index) => (
                                <TableRow key={`${row.year}-${row.month}-${index}`} hover>
                                    <TableCell sx={{
                                        position: 'sticky',
                                        alignItems: 'center',
                                        left: 0,
                                        backgroundColor: 'background.paper',
                                        zIndex: 1
                                    }}>
                                        {row.year}
                                    </TableCell>
                                    <TableCell sx={{
                                        position: 'sticky',
                                        left: 64,
                                        backgroundColor: 'background.paper',
                                        zIndex: 1
                                    }}>
                                        {String(row.month).padStart(2, '0')}
                                    </TableCell>
                                    {dayHeaders.map((day) => {
                                        const flowKey = `Flow_${(day >= 10) ? String(day) : 0 + String(day)}` as keyof DailyFlowsRow;
                                        const value = row[flowKey];
                                        return (
                                            <TableCell
                                                key={day}
                                                align={(value !== null) ? 'right' : 'center'}
                                                sx={{
                                                    backgroundColor: value === null ? 'action.hover' : 'inherit',
                                                    color: value === null ? 'text.disabled' : 'inherit',
                                                }}
                                            >
                                                {value !== null ? (typeof value === 'number' ? value.toFixed(2) : value) : ''}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component='div'
                count={streamflowData.length}
                page={tablePage}
                onPageChange={handleChangeTablePage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[]}
                
                sx={{ display: (isImporting || paginatedData.length === 0) ? 'none' : '' }}
            />
        </Paper>
    );
}

export default StreamflowScreen;
