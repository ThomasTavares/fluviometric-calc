import { JSX, useState, useEffect } from 'react';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import InfoOutlineRoundedIcon from '@mui/icons-material/InfoOutlineRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { ScreenType } from '../../interfaces/main.interface';
import SideBarProps from '../../interfaces/sidebar.interface';

const screensInfoMap: { label: string; key: ScreenType }[] = [
    { label: 'Informações Estação', key: 'home' },
    { label: 'Pré-Processamento', key: 'pre-processing' },
    { label: 'Dados Fluviométricos', key: 'streamflow' },
    { label: 'Curva de Permanência', key: 'flow-duration-curve' },
    { label: 'Vazão Q7,10', key: 'q710' }
];

function SideBar(props: SideBarProps): JSX.Element {
    const mainScreenProps = props.mainScreenProps;
    const [stationName, setStationName] = useState<string>('');
    const [stationId, setStationId] = useState<string>('');

    useEffect(() => {
        if (props.open) {
            loadStationInfo();
        }
    }, [props.open]);

    const loadStationInfo = async () => {
        const id = sessionStorage.getItem('stationId');
        
        if (!id || id === 'temp') {
            setStationId('');
            setStationName('Nenhuma estação selecionada');
            return;
        }

        setStationId(id);

        try {
            const result = await window.backendApi.stations.getById(id);
            if (result.success && result.data) {
                setStationName(result.data.name || `Estação ${id}`);
            } else {
                setStationName(`Estação ${id}`);
            }
        } catch (err) {
            setStationName(`Estação ${id}`);
        }
    };

    const handleSelection = (screen: ScreenType) => {
        if (!mainScreenProps.onSelectScreen) return;
        mainScreenProps.onSelectScreen(screen);
        props.onClose();
    };

    const renderScreenIcon = (screen: ScreenType): JSX.Element => {
        switch (screen) {
            case 'home':
                return <InfoOutlineRoundedIcon />;
            case 'sync':
                return <SyncRoundedIcon />;
            case 'pre-processing':
                return <TuneRoundedIcon />;
            case 'streamflow':
                return <TableChartOutlinedIcon />;
            case 'flow-duration-curve':
                return <TimelineIcon />;
            case 'q710':
                return <BarChartRoundedIcon />;
        }
    };

    return (
        <Drawer
            open={props.open}
            onClose={props.onClose}
            variant='temporary'
            slotProps={{
                backdrop: { sx: { backgroundColor: 'transparent' } }
            }}
        >
            <Box sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <List>
                    <ListItem key={'close'} disablePadding divider={true}>
                        <ListItemButton onClick={props.onClose}>
                            <ListItemIcon>
                                <ArrowBackIosRoundedIcon />
                            </ListItemIcon>
                        </ListItemButton>
                    </ListItem>
                    <ListItem key={'start'} disablePadding>
                        <ListItemButton onClick={() => mainScreenProps.onBack ? mainScreenProps.onBack() : null}>
                            <ListItemIcon>
                                <UndoRoundedIcon />
                            </ListItemIcon>
                            <ListItemText primary={'Alterar Estação'} sx={{ ml: -1.5 }}/>
                        </ListItemButton>
                    </ListItem>
                    {screensInfoMap.map((screen) => (
                        <ListItem key={screen.key} disablePadding>
                            <ListItemButton onClick={() => handleSelection(screen.key)}>
                            <ListItemIcon>
                                {renderScreenIcon(screen.key)}
                            </ListItemIcon>
                            <ListItemText primary={screen.label} sx={{ ml: -1.5 }}/>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Box sx={{ flexGrow: 1 }} />

                <Divider />
                
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 2, 
                        backgroundColor: 'background.default',
                        borderRadius: 0
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOnIcon fontSize='small' color={stationId ? 'primary' : 'disabled'} />
                        <Typography variant='caption' color='text.secondary' fontWeight='bold'>
                            ESTAÇÃO SELECIONADA
                        </Typography>
                    </Box>
                    <Typography 
                        variant='body2' 
                        fontWeight='medium' 
                        noWrap 
                        title={stationName}
                        sx={{ 
                            color: stationId ? 'text.primary' : 'text.disabled',
                            fontStyle: stationId ? 'normal' : 'italic'
                        }}
                    >
                        {stationName}
                    </Typography>
                    {stationId && (
                        <Typography variant='caption' color='text.secondary'>
                            Código: {stationId}
                        </Typography>
                    )}
                </Paper>
            </Box>
        </Drawer>
    );
}

export default SideBar;
