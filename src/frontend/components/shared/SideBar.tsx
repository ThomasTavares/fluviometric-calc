import { JSX, useState } from 'react';

import Fab from '@mui/material/Fab';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

import { MainScreenProps, ScreenType } from '../../interfaces/MainInterface';

const screensInfoMap: { label: string; key: ScreenType }[] = [
    { label: 'Informações Estação', key: 'home' },
    { label: 'Pré-Processamento', key: 'pre-processing' },
    { label: 'Vazões', key: 'streamflow' },
    { label: 'Percentis', key: 'percentile' },
    { label: 'Q710', key: 'q710' }
];

function SideBar(props: MainScreenProps): JSX.Element {
    const [open, setOpen] = useState<boolean>(false);

    const handleSelection = (screen: ScreenType) => {
        if (!props.onSelectScreen) return;
        props.onSelectScreen(screen);
    }

    return (
        <>
            <Drawer
                open={open}
                onClose={() => setOpen(false)}
                variant='persistent'
            >
                <Box sx={{ width: 250 }}>
                    <List>
                        <ListItem key={'close'} disablePadding>
                            <ListItemButton onClick={() => setOpen(false)}>
                                <ListItemIcon>
                                    <ArrowBackIcon />
                                </ListItemIcon>
                            </ListItemButton>
                        </ListItem>
                        <Divider />
                        <ListItem key={'start'} disablePadding>
                            <ListItemButton onClick={() => props.onBack ? props.onBack() : null}>
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
            <Fab
                variant='circular'
                size='small'
                disabled={open}
                onClick={() => setOpen(true)}
            >
                <MenuIcon />
            </Fab>
        </>
    );
}

export default SideBar;