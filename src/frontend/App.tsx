import { JSX, useState } from 'react';
import StartScreen from './components/basic-screens/StartScreen';
import SyncScreen from './components/basic-screens/SyncScreen';
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

    const handleSyncInit = () => {
        const stationId = sessionStorage.getItem('stationId');

        if (stationId) {
            const placeholderInfo: Station = {
                id: stationId,
                name: '',
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
            
            setStationData(placeholderInfo);
            setCurrentBasicScreen('main');
        }
    };

    const renderBasicScreen = (): JSX.Element => {
        if (currentBasicScreen === 'main' && (stationData)) {
            return (
                <MainScreen
                    stationData={stationData}
                    onBack={() => setCurrentBasicScreen('start')}
                />
            );
        } else if (currentBasicScreen === 'sync-mode') {
            return (
                <SyncScreen
                    onInit={handleSyncInit}
                    onBack={() => setCurrentBasicScreen('start')}
                />
            );
        } else {
            return <StartScreen
                onInit={handleInit}
                onSync={() => setCurrentBasicScreen('sync-mode')}
            />;
        }
    };

    return <div>{renderBasicScreen()}</div>;
}

export default App;
