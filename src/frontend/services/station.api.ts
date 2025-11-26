import { Station } from "../../backend/db";

interface StationValidationResponse {
    success: boolean;
    exists: boolean;
    data?: Station;
    error?: string;
}

export const validateStationCode = async (stationCode: string): Promise<StationValidationResponse> => {
    try {
        const result = await window.backendApi.stations.getById(stationCode);

        if (result.success && result.data) {
            return {
                success: true,
                exists: true,
                data: result.data
            };
        } else {
            return {
                success: true,
                exists: false,
                error: result.error || 'Station not found'
            };
        }
    } catch (error) {
        console.error('Error validating station:', error);
        return {
            success: false,
            exists: false,
            error: 'Error connecting to database'
        };
    }
};

export const getAllStations = async () => {
    try {
        return await window.backendApi.stations.getAll();
    } catch (error) {
        console.error('Error getting all stations:', error);
        return { success: false, error: 'Error fetching stations' };
    }
};

export const searchStations = async (filters: any) => {
    try {
        return await window.backendApi.stations.search(filters);
    } catch (error) {
        console.error('Error searching stations:', error);
        return { success: false, error: 'Error searching stations' };
    }
};