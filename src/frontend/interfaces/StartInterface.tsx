import StationData from "./StationInterface";

export interface StartScreenProps {
    onInit: (data: StationData) => void;
}