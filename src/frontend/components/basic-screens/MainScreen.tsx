import { JSX, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { MainScreenProps, ScreenType } from '../../interfaces/MainInterface';
import HomeScreen from '../screens/HomeScreen';
import SideBar from '../shared/SideBar';

function MainScreen(props: MainScreenProps): JSX.Element {
    const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');

    const renderScreen = ():JSX.Element => {
        switch (currentScreen) {
            case 'pre-processing':
                return <></>;
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
        <Stack>
            <SideBar onSelectScreen={setCurrentScreen} onBack={props.onBack}/>
            <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: 3,
            }}>
                <Stack>
                    {renderScreen()}
                </Stack>
            </Box>
        </Stack>
    );
}

export default MainScreen;