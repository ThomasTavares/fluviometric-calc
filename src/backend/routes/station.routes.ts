import { ipcMain } from "electron";
import { StationController } from "../controllers/station.controller";
import Database from "better-sqlite3";
import { StationService } from "../services/station.service";

export const StationChannels = {
    getAll:  "stations:getAll",
    getById: "stations:getById",
    update:  "stations:update",
    search:  "stations:search",
    count:   "stations:count",
} as const;

export function register(db: Database.Database): void {
    const service    = new StationService(db);
    const controller = new StationController(service);
    registerStationRoutes(controller);
}

export function registerStationRoutes(controller: StationController): void {
    ipcMain.handle(StationChannels.getAll,  async ()              => controller.handleGetAllStations());
    ipcMain.handle(StationChannels.getById, async (_e, id)        => controller.handleGetStationById(id));
    ipcMain.handle(StationChannels.update,  async (_e, stationData) => controller.handleUpdateStation(stationData));
    ipcMain.handle(StationChannels.search,  async (_e, filters)   => controller.handleSearchStations(filters));
    ipcMain.handle(StationChannels.count,   async ()              => controller.handleGetStationCount());
}
