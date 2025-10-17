import { ipcMain } from "electron";
import { Q710Controller } from "../controllers/q710.controller";

interface DateRange {
    startDate?: string;
    endDate?: string;
}

export function registerQ710Routes(controller: Q710Controller): void {

    ipcMain.handle(
        "analysis:calculateQ710",
        async (
            event,
            params: {
                stationId: string;
                dateRange?: DateRange;
            }
        ) => {
            return await controller.handleCalculateQ710(
                params.stationId,
                params.dateRange
            );
        }
    );
}