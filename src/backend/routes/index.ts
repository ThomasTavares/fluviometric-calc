import { BrowserWindow } from "electron";
import Database from "better-sqlite3";

import { register as registerStations }   from "./station.routes";
import { register as registerStreamflow } from "./streamflow.routes";
import { register as registerPercentile } from "./percentile.routes";
import { register as registerSync }       from "./sync.routes";
import { register as registerExport }     from "./export.routes";

export function registerAll(db: Database.Database, mainWindow: BrowserWindow): void {
    registerStations(db);
    registerStreamflow(db);
    registerPercentile(db);
    registerSync(db, mainWindow);
    registerExport(db, mainWindow);
}