import { JSX } from 'react';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import InfoOutlineRoundedIcon from '@mui/icons-material/InfoOutlineRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';

import { ScreenType } from '../../interfaces/main.interface';
import SideBarProps from '../../interfaces/sidebar.interface';

const screensInfoMap: { label: string; key: ScreenType }[] = [
    { label: 'Informações Estação', key: 'home' },
    /* { label: 'Pré-Processamento', key: 'pre-processing' }, */
    { label: 'Dados Fluviométricos', key: 'streamflow' },
    { label: 'Curva de Permanência', key: 'flow-duration-curve' },
    { label: 'Vazão Q7,10', key: 'q710' }
];

function SideBar(props: SideBarProps): JSX.Element {
    const mainScreenProps = props.mainScreenProps;

    const handleSelection = (screen: ScreenType) => {
        if (!mainScreenProps.onSelectScreen) return;
        mainScreenProps.onSelectScreen(screen);
        props.onClose();
    };

    const renderScreenIcon = (screen: ScreenType): JSX.Element => {
        switch (screen) {
            case 'home':
                return <InfoOutlineRoundedIcon />;
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
            <Box sx={{ width: 250 }}>
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
            </Box>
        </Drawer>
    );
}

export default SideBar;