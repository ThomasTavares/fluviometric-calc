import { JSX, useState } from 'react';
import StartScreen from './components/basic-screens/StartScreen';
import MainScreen from './components/basic-screens/MainScreen';
import { Station } from '../backend/db';

type BasicScreenType = 'start' | 'main';

function App(): JSX.Element {
    const [currentBasicScreen, setCurrentBasicScreen] = useState<BasicScreenType>('start');
    const [stationData, setStationData] = useState<Station | null>(null);

    const handleInit = (data: Station) => {
        sessionStorage.clear();
        sessionStorage.setItem('stationId', data.id);

        setStationData(data);
        setCurrentBasicScreen('main');
    }

    const renderBasicScreen = ():JSX.Element => {
        if (currentBasicScreen == 'main' && stationData) {
            return (
                <MainScreen
                    stationData={stationData}
                    onBack={() => setCurrentBasicScreen('start')}
                />
            );
        } else {
            return <StartScreen onInit={handleInit}/>;
        }
    };

    return <div>{renderBasicScreen()}</div>;
}

export default App;