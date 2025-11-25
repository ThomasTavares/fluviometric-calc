import { JSX, useState } from 'react';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

import TopBarProps from '../../interfaces/topbar.interface';
import SideBar from './SideBar';

function TopBar(props: TopBarProps): JSX.Element {
    const [sideOpen, setSideOpen] = useState<boolean>(false);

    const renderScreenName = ():string => {
        if (sideOpen) return '';
        switch (props.screen) {
            case 'pre-processing':
                return 'Pré-Processamento';
            case 'streamflow':
                return 'Dados Fluviométricos';
            case 'percentile':
                return 'Curva de Permanência';
            case 'q710':
                return 'Vazão Q710';
            default:
                return 'Informações Estação';
        }
    };

    return (
        <>
            <AppBar position='sticky' color='inherit' sx={{ boxShadow: 1 }}>
                <Toolbar variant='dense'>
                    <IconButton
                        size='medium'
                        edge='start'
                        color='inherit'
                        aria-label='menu'
                        sx={{ mr: 1 }}
                        onClick={() => setSideOpen(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant='h6'>
                        {renderScreenName()}
                    </Typography>
                </Toolbar>
            </AppBar>
            <SideBar
                mainScreenProps={{
                        onSelectScreen: props.mainScreenProps.onSelectScreen,
                        onBack: props.mainScreenProps.onBack
                    }}
                open={sideOpen}
                onClose={() => setSideOpen(false)}
            />
        </>
    );
}

export default TopBar;