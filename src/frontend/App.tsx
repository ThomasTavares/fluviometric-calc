import { JSX, useState } from 'react';
import StartScreen from './components/basic-screens/StartScreen';
import MainScreen from './components/basic-screens/MainScreen';
import { Station } from '../backend/db';

type BasicScreenType = 'start' | 'main' | 'sync-mode';

function App(): JSX.Element {
    const [currentBasicScreen, setCurrentBasicScreen] = useState<BasicScreenType>('start');
    const [stationData, setStationData] = useState<Station | null>(null);

    const handleInit = (data: Station) => {
        sessionStorage.clear();
        sessionStorage.setItem('stationId', data.id);

        setStationData(data);
        setCurrentBasicScreen('main');
    };

    const handleSyncMode = () => {
        sessionStorage.clear();
        const tempStation: Station = {
            id: 'temp',
            name: 'Modo Sincronização',
            type: 'Fluviométrica',
            additional_code: null,
            basin_code: '',
            sub_basin_code: '',
            river_name: '',
            state_name: '',
            city_name: '',
            responsible_sigla: '',
            operator_sigla: '',
            drainage_area: null,
            latitude: null,
            longitude: null,
            altitude: null,
            created_at: new Date()
        };

        setStationData(tempStation);
        setCurrentBasicScreen('sync-mode');
    };

    const renderBasicScreen = (): JSX.Element => {
        if (currentBasicScreen === 'main' && stationData) {
            return (
                <MainScreen
                    stationData={stationData}
                    onBack={() => setCurrentBasicScreen('start')}
                />
            );
        } else if (currentBasicScreen === 'sync-mode' && stationData) {
            return (
                <MainScreen
                    stationData={stationData}
                    onBack={() => setCurrentBasicScreen('start')}
                    initialScreen='sync'
                />
            );
        } else {
            return <StartScreen onInit={handleInit} onSyncMode={handleSyncMode} />;
        }
    };

    return <div>{renderBasicScreen()}</div>;
}

export default App;
