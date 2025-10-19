import { StationService } from "../services/station.service";

export class StationController {
    private stationService: StationService;

    constructor(stationService: StationService) {
        this.stationService = stationService;
    }

    async handleGetAllStations() {
        return this.stationService.getAllStations();
    }

    async handleGetStationById(id: string) {
        return this.stationService.getStationById(id);
    }

    async handleSearchStations(filters: {
        name?: string;
        basin_code?: string;
        sub_basin_code?: string;
        river_name?: string;
        state_name?: string;
        city_name?: string;
    }) {
        return this.stationService.searchStations(filters);
    }

    async handleGetStationCount() {
        return this.stationService.getStationCount();
    }
}