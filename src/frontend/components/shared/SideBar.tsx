import { JSX, useState } from 'react';

import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import QueryStatsIcon from '@mui/icons-material/QueryStats';

import { MainScreenProps, ScreenType } from '../../interfaces/MainInterface';

function SideBar(props: MainScreenProps): JSX.Element {
    const [open, setOpen] = useState<boolean>(false);

    const handleSelection = (opt: number) => {
        if (!props.onSelectScreen) return;
        let screen: ScreenType = 'home';
        switch (opt) {
            case 0:
                screen = 'streamflow';
                break;
            case 1:
                screen = 'percentile';
                break;
            case 2:
                screen = 'q710'
                break;
            default:
                screen = 'home';
                break;
        }
        props.onSelectScreen(screen);
    }

    return (
        <Drawer open={open} onClose={() => setOpen(false)} variant='temporary'>
            <Box sx={{ width: 250 }}>
                <List>
                    {['Vazões', 'Percentis', 'Q710'].map((text, index) => (
                        <ListItem key={index} disablePadding>
                            <ListItemButton onClick={() => handleSelection(index)}>
                            <ListItemIcon>
                                <QueryStatsIcon />
                            </ListItemIcon>
                            <ListItemText primary={text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Drawer>
    );
}

export default SideBar;