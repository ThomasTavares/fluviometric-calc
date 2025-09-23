import { app } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

export function initDatabase() {
    const isDev = !app.isPackaged;
    const dbDir = isDev
        ? path.resolve(__dirname, "../db")
        : path.join(process.resourcesPath, "db");

    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, "schema.db");

    const db = new Database(dbPath, { verbose: console.log });
    db.pragma("journal_mode = WAL");

    db.exec(`
        CREATE TABLE IF NOT EXISTS station (
            id INTEGER PRIMARY KEY,
            name TEXT,
            data TEXT
        )
    `);

    const data = {"data1": 10, "data2:": "abc"};

    db.prepare("INSERT INTO station (id, name, data) VALUES (?, ?, ?)").run(123, "Station 123", JSON.stringify(data));

    const rows = db.prepare("SELECT * FROM station").all();
    console.log("Stations in DB:", rows);

    return db;
}