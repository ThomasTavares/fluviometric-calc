import { Station } from "../../backend/db";

export type ScreenType = 'home' | 'pre-processing' | 'streamflow' | 'flow-duration-curve' | 'q710';

export interface MainScreenProps {
    stationData?: Station;
    onSelectScreen?: (screen: ScreenType) => void;
    onBack?: () => void;
}