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

import { ServiceResponse, DailyFlowsRow } from '../../../backend/services/streamflow.service';

function StreamflowScreen(): JSX.Element {
    const [isImporting, setIsImporting] = useState<boolean>(false);
    const [importError, setImportError] = useState<string>('');
    const [streamflowData, setStreamflowData] = useState<DailyFlowsRow[]>([]);
    const [tablePage, setTablePage] = useState<number>(0);

    const stationId = sessionStorage.getItem('stationId');
    const startDate = sessionStorage.getItem('startDate');
    const endDate = sessionStorage.getItem('endDate');

    if (!stationId) {
        throw new Error('Station ID is missing in session storage.');
    }

    useEffect(() => {
        handleImport();
    }, []);

    const handleImport = async () => {
        console.log('Importing streamflow data for station: ', stationId);
        setIsImporting(true);
        setImportError('');

        try {
            const response: ServiceResponse<DailyFlowsRow[]> = await window.backendApi.streamflow.getForExport(stationId,
                                                                                                             startDate || undefined,
                                                                                                             endDate || undefined
                                                                                                            );
            if (response.success && response.data) {
                setStreamflowData(response.data);
                console.log('Imported streamflow data successfully.');
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

    return (
        <Paper
            elevation={3}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {importError && (<Alert severity='error' sx={{ mb: 2 }}>{importError}</Alert>)}

            {isImporting && <LinearProgress />}

            <TableContainer
                sx={{ 
                    flexGrow: 1,
                    overflow: 'auto',
                    maxHeight: '80vh',
                    borderRadius: 1
                }}
            >
                <Table size='small' stickyHeader sx={{ display: (isImporting || importError) ? 'none' : '' }}>
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
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={33} align='center' sx={{ py: 4 }}>
                                    No streamflow data available
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((row, index) => (
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
                        )}
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
                
                sx={{ display: isImporting ? 'none' : '' }}
            />
        </Paper>
    );
}

export default StreamflowScreen;