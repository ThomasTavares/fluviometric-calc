import { JSX, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { MainScreenProps, ScreenType } from '../../interfaces/main.interface';
import TopBar from '../shared/TopBar';
import HomeScreen from '../screens/HomeScreen';
import StreamflowScreen from '../screens/StreamflowScreen';

function MainScreen(props: MainScreenProps): JSX.Element {
    const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');

    const renderScreen = ():JSX.Element => {
        switch (currentScreen) {
            case 'pre-processing':
                return <></>;
            case 'streamflow':
                return <StreamflowScreen />;
            case 'percentile':
                return <></>;
            case 'q710':
                return <></>;
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
                    onBack: props.onBack
                }}
            />
            <Box sx={{
                flexGrow: 1,
                width: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
                padding: 3,
            }}>
                {renderScreen()}
            </Box>
        </Stack>
    );
}

export default MainScreen;