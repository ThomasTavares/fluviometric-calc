import StationData from "./StationInterface";

export type ScreenType = 'home' | 'streamflow' | 'percentile' | 'q710';

export interface MainScreenProps {
    stationData?: StationData;
    onSelectScreen?: (screen: ScreenType) => void;
    onBack?: () => void;
}