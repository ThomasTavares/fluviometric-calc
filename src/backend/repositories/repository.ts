import path from "path";
import { app } from "electron";
import Database from "better-sqlite3";

export function initDatabase() {
    const isDev = !app.isPackaged;
    const dbPath = isDev
        ? path.join(__dirname, ".", "db", "schema.db")
        : path.join(process.resourcesPath, "db", "schema.db");

    const db = new Database(dbPath);
    db.exec("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT);");

    //db.prepare("INSERT INTO users (name) VALUES (?)").run("Alice");

    const rows = db.prepare("SELECT * FROM users").all();
    console.log("Users in DB:", rows);

    return db;
}