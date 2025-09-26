import { app } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

let databaseConnection: Database.Database | null = null;

/**
 * Inicializa a conexão com o banco de dados e cria a tabela se necessário.
 * Retorna a conexão aberta.
 */
export function initDatabase(): Database.Database {
    const isDevelopment = !app.isPackaged;
    const databaseDirectory = isDevelopment
        ? path.resolve(__dirname, "../db")
        : path.join(process.resourcesPath, "db");

    if (!fs.existsSync(databaseDirectory)) {
        fs.mkdirSync(databaseDirectory, { recursive: true });
    }

    const databasePath = path.join(databaseDirectory, "schema.db");

    const database = new Database(databasePath, { verbose: console.log });
    database.pragma("journal_mode = WAL");

    database.exec(`
        CREATE TABLE IF NOT EXISTS station (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            data TEXT
        )
    `);

    databaseConnection = database;

    return databaseConnection;
}

/**
 * Retorna todas as estações do banco como um array de objetos.
 * Cada objeto tem as colunas do banco: id, name, data (string JSON).
 */
export function getAllStations(): Array<{ id: number; name: string; data: string }> {
    if (!databaseConnection) {
        throw new Error("Database is not initialized. Call initDatabase() first.");
    }
    const stationRows = databaseConnection.prepare("SELECT * FROM station").all() as Array<{ id: number; name: string; data: string }>;
    return stationRows;
}

/**
 * Salva ou atualiza uma estação no banco.
 * - stationPayload deve conter { codigo_estacao: string, items: Array<any> }
 * - Armazenamos o objeto completo como texto JSON na coluna `data`
 */
export function saveStationJson(stationPayload: { codigo_estacao: string; items: Array<any> }): { success: boolean; message?: string } {
    if (!databaseConnection) {
        throw new Error("Database is not initialized. Call initDatabase() first.");
    }

    if (!stationPayload || typeof stationPayload.codigo_estacao !== "string" || !Array.isArray(stationPayload.items)) {
        throw new Error("Invalid station payload. Expected { codigo_estacao: string, items: Array }");
    }

    const stationCode = stationPayload.codigo_estacao;
    const jsonString = JSON.stringify(stationPayload);

    // Verifica se já existe um registro com esse código (usamos name para guardar o código)
    const existingRecord = databaseConnection.prepare("SELECT id FROM station WHERE name = ?").get(stationCode);

    // Ensure that `existingRecord` is not undefined and has the expected properties
    if (existingRecord) {
        databaseConnection.prepare("UPDATE station SET data = ? WHERE id = ?").run(jsonString);
        return { success: true, message: "Updated existing station record." };
    } else {
        databaseConnection.prepare("INSERT INTO station (name, data) VALUES (?, ?)").run(stationCode, jsonString);
        return { success: true, message: "Inserted new station record." };
    }
}