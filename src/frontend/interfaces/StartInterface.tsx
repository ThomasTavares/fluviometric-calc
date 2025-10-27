export interface StartScreenProps {
    onInit: (data: {
        stationCode: string;
        stationName: string;
        startDate: string;
        endDate: string;
    }) => void;
}