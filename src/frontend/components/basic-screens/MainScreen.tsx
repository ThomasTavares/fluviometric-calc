import { JSX, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { MainScreenProps, ScreenType } from '../../interfaces/main.interface';
import TopBar from '../menu/TopBar';
import HomeScreen from '../screens/HomeScreen';
import StreamflowScreen from '../screens/StreamflowScreen';
import PreProcessingScreen from '../screens/PreProcessingScreen';
import FlowDurationScreen from '../screens/FlowDurationScreen';

import Q710Analysis from '../../../frontend.old/components/ui/pages/q710Analysis';

function MainScreen(props: MainScreenProps): JSX.Element {
    const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);

    const renderScreen = (): JSX.Element => {
        switch (currentScreen) {
            case 'pre-processing':
                return <PreProcessingScreen />;
            case 'streamflow':
                return <StreamflowScreen />;
            case 'flow-duration-curve':
                return <FlowDurationScreen />;
            case 'q710':
                return <Q710Analysis onBack={null}/>;
            default:
                return <HomeScreen stationData={props.stationData}/>;
        }
    };

    return (
        <Stack>
            <TopBar
                screen={currentScreen}
                mainScreenProps={{
                    onSelectScreen: setCurrentScreen,
                    onBack: () => setDialogOpen(true)
                }}
            />
            <Box sx={{
                flexGrow: 1,
                width: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
                padding: 3,
            }}>
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                >
                    <DialogTitle>{'Deseja alterar a estação?'}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Ao alterar a estação, todas as modificações serão perdidas.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            variant='outlined'
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant='contained'
                            onClick={() => { if (props.onBack) props.onBack(); }} autoFocus
                        >
                            Confirmar
                        </Button>
                    </DialogActions>
                </Dialog>

                {renderScreen()}
            </Box>
        </Stack>
    );
}

export default MainScreen;
