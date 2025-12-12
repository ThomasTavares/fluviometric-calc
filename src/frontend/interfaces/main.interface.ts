import { Station } from '../../backend/db';

export type ScreenType = 'home' | 'sync' | 'pre-processing' | 'streamflow' | 'flow-duration-curve' | 'q710';

export interface MainScreenProps {
    stationData?: Station;
    onBack?: () => void;
    onSelectScreen?: (screen: ScreenType) => void;
}
