import { JSX, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
//import Button from '@mui/material/Button';

import { MainScreenProps, ScreenType } from '../../interfaces/MainInterface';
import HomeScreen from '../screens/HomeScreen';
import SideBar from '../shared/SideBar';

function MainScreen(props: MainScreenProps): JSX.Element {
    const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');

    const renderScreen = ():JSX.Element => {
        switch (currentScreen) {
            case 'streamflow':
                return <></>;
            case 'percentile':
                return <></>;
            case 'q710':
                return <></>;
            default:
                return <HomeScreen stationData={props.stationData}/>;
        }
    };

    return (
        <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: 3,
        }}>
            <SideBar onSelectScreen={setCurrentScreen}/>
            <Stack>
                {renderScreen()}
            </Stack>
        </Box>
    );
}

export default MainScreen;