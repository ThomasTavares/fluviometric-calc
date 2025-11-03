import { JSX, useState } from 'react';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

import { ScreenType } from '../../interfaces/MainInterface';
import SideBarProps from '../../interfaces/SideBarInterface';

const screensInfoMap: { label: string; key: ScreenType }[] = [
    { label: 'Informações Estação', key: 'home' },
    { label: 'Pré-Processamento', key: 'pre-processing' },
    { label: 'Vazões', key: 'streamflow' },
    { label: 'Percentis', key: 'percentile' },
    { label: 'Q710', key: 'q710' }
];

function SideBar(props: SideBarProps): JSX.Element {
    const mainScreenProps = props.mainScreenProps;

    const handleSelection = (screen: ScreenType) => {
        if (!mainScreenProps.onSelectScreen) return;
        mainScreenProps.onSelectScreen(screen);
        props.onClose();
    }

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
                                <ArrowBackIcon />
                            </ListItemIcon>
                        </ListItemButton>
                    </ListItem>
                    <ListItem key={'start'} disablePadding>
                        <ListItemButton onClick={() => mainScreenProps.onBack ? mainScreenProps.onBack() : null}>
                            <ListItemIcon>
                                <ArrowBackIcon />
                            </ListItemIcon>
                            <ListItemText primary={'Alterar Estação'} />
                        </ListItemButton>
                    </ListItem>
                    {screensInfoMap.map((screen) => (
                        <ListItem key={screen.key} disablePadding>
                            <ListItemButton onClick={() => handleSelection(screen.key)}>
                            <ListItemIcon>
                                <QueryStatsIcon />
                            </ListItemIcon>
                            <ListItemText primary={screen.label} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Drawer>
    );
}

export default SideBar;