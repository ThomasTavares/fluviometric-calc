import { ipcMain } from "electron";
import { StationController } from "../controllers/station.controller";

export function registerStationRoutes(controller: StationController): void {
    ipcMain.handle("stations:getAll", async () => {
        return await controller.handleGetAllStations();
    });

    ipcMain.handle("stations:getById", async (event, id: string) => {
        return await controller.handleGetStationById(id);
    });

    ipcMain.handle("stations:update", async (event, stationData: {
        id: string;
        name?: string;
        type?: string;
        additional_code?: string;
        basin_code?: string;
        sub_basin_code?: string;
        river_name?: string;
        state_name?: string;
        city_name?: string;
        responsible_sigla?: string;
        operator_sigla?: string;
        drainage_area?: number;
        latitude?: number;
        longitude?: number;
        altitude?: number;
    }) => {
        return await controller.handleUpdateStation(stationData);
    });

    ipcMain.handle(
        "stations:search",
        async (
            event,
            filters: {
                name?: string;
                basin_code?: string;
                sub_basin_code?: string;
                river_name?: string;
                state_name?: string;
                city_name?: string;
            }
        ) => {
            return await controller.handleSearchStations(filters);
        }
    );

    ipcMain.handle("stations:count", async () => {
        return await controller.handleGetStationCount();
    });
}
