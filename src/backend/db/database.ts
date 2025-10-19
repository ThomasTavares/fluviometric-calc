import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export class DatabaseManager {
    private static instance: DatabaseManager;
    private db: Database.Database | null = null;

    private constructor() {}

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    public initializeDatabase(): Database.Database {
        if (this.db) {
            return this.db;
        }

        const dbPath = this.getDatabasePath();
        this.ensureDirectoryExists(path.dirname(dbPath));

        this.db = new Database(dbPath);
        this.configurePragmas();
        this.createTables();

        console.log("Database initialized at:", dbPath);
        return this.db;
    }

    private getDatabasePath(): string {
        const dbDirectory = path.resolve(__dirname);
        return path.join(dbDirectory, "schema.db");
    }

    private ensureDirectoryExists(directory: string): void {
        if (!fs.existsSync(directory)) {
            console.log("Creating database directory...");
            fs.mkdirSync(directory, { recursive: true });
        }
    }

    private configurePragmas(): void {
        if (!this.db) throw new Error("Database not initialized");

        this.db.pragma("journal_mode = WAL");
        this.db.pragma("cache_size = -64000");
        this.db.pragma("foreign_keys = ON");
    }

    private createTables(): void {
        if (!this.db) throw new Error("Database not initialized");

        this.createStationsTable();
        this.createDailyStreamflowsTable();
        this.createMonthlyStatsTable();
        this.createIndexes();
    }

    private createStationsTable(): void {
        if (!this.db) throw new Error("Database not initialized");

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS stations (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				type TEXT,
				additional_code TEXT,
				basin_code TEXT,
				sub_basin_code TEXT,
				river_name TEXT,
				state_name TEXT,
				city_name TEXT,
				responsible_sigla TEXT,
				operator_sigla TEXT,
				drainage_area REAL,
				latitude REAL,
				longitude REAL,
				altitude REAL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
        `);
    }

    private createDailyStreamflowsTable(): void {
        if (!this.db) throw new Error("Database not initialized");

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS daily_Streamflows (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				station_id TEXT NOT NULL,
				date DATE NOT NULL,
				flow_rate REAL,
				status INTEGER,
				consistency_level INTEGER,
				UNIQUE(station_id, date),
				FOREIGN KEY (station_id) REFERENCES stations (id) ON DELETE CASCADE
			)
        `);
    }

    private createMonthlyStatsTable(): void {
        if (!this.db) throw new Error("Database not initialized");

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS monthly_stats (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				station_id TEXT NOT NULL,
				year INTEGER NOT NULL,
				month INTEGER NOT NULL,
				monthly_avg REAL,
				monthly_max REAL,
				monthly_min REAL,
				valid_days INTEGER,
				UNIQUE(station_id, year, month),
				FOREIGN KEY (station_id) REFERENCES stations (id) ON DELETE CASCADE
			)
        `);
    }

    private createIndexes(): void {
        if (!this.db) throw new Error("Database not initialized");

        const indexes = [
            "CREATE INDEX IF NOT EXISTS idx_daily_streamflows_station_date ON daily_streamflows(station_id, date)",
            "CREATE INDEX IF NOT EXISTS idx_daily_streamflows_date ON daily_streamflows(date)",
            "CREATE INDEX IF NOT EXISTS idx_monthly_stats_station_year_month ON monthly_stats(station_id, year, month)",
            "CREATE INDEX IF NOT EXISTS idx_stations_name ON stations(name)",
            "CREATE INDEX IF NOT EXISTS idx_stations_basin ON stations(basin_code)",
            "CREATE INDEX IF NOT EXISTS idx_stations_state ON stations(state_name)",
            "CREATE INDEX IF NOT EXISTS idx_stations_river ON stations(river_name)",
        ];

        for (const index of indexes) {
            this.db.exec(index);
        }
    }

    public getDatabase(): Database.Database {
        if (!this.db) {
            throw new Error("Database not initialized. Call initializeDatabase() first.");
        }
        return this.db;
    }

    public closeDatabase(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log("Database connection closed");
        }
    }

    public isInitialized(): boolean {
        return this.db !== null;
    }
}
