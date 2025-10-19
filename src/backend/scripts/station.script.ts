import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { app } from "electron";

interface StationJSON {
    id: string;
    nome: string;
    tipoEstacao: string;
    codigoAdicional?: string | null;
    codigoNomeBacia?: string | null;
    codigoNomeSubBacia?: string | null;
    nomeRio?: string | null;
    nomeEstado?: string | null;
    nomeMunicipio?: string | null;
    responsavelSigla?: string | null;
    operadoraSigla?: string | null;
    areaDrenagem?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    altitude?: number | null;
}

interface ImportResult {
    success: boolean;
    imported?: number;
    errors?: number;
    total?: number;
    error?: string;
    state?: string;
}

const AVAILABLE_STATES = [
    {
        name: "santa-catarina",
        file: "infoEstacoesFluvSC.json",
    },
    {
        name: "rio-grande-do-sul",
        file: "infoEstacoesFluvRS.json",
    },
    // Para novos estados, adicionar assim:
    //{
    //  name: "parana",
    //  file: "infoEstacoesFluvSC.json"
    //},
];

async function importStationsFromState(db: Database.Database, stateName: string): Promise<ImportResult> {
    try {
        const stateConfig = AVAILABLE_STATES.find((s) => s.name === stateName);

        if (!stateConfig) {
            throw new Error(`State '${stateName}' not configured`);
        }

        const isDev = !app.isPackaged;
        const stationsFile = path.join(process.cwd(), "src", "data", stateName, "metadados-estacoes", stateConfig.file);

        console.log(`\nImporting stations from ${stateConfig.name}...`);
        console.log(`File: ${stationsFile}`);

        if (!fs.existsSync(stationsFile)) {
            throw new Error(`Stations file not found for ${stateConfig.name}`);
        }

        const rawData = fs.readFileSync(stationsFile, "utf-8");
        const data = JSON.parse(rawData) as { content: StationJSON[] };

        if (!data.content || !Array.isArray(data.content)) {
            throw new Error("Invalid JSON structure - expected {content: [...]}");
        }

        console.log(`Found ${data.content.length} stations`);

        const insert = db.prepare(`
            INSERT OR REPLACE INTO stations (
                id, name, type, additional_code, basin_code, sub_basin_code,
                river_name, state_name, city_name, responsible_sigla, operator_sigla,
                drainage_area, latitude, longitude, altitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let success = 0;
        let errors = 0;

        const transaction = db.transaction((stations: StationJSON[]) => {
            for (const station of stations) {
                try {
                    if (!station.id || !station.nome || !station.tipoEstacao) {
                        errors++;
                        continue;
                    }

                    insert.run(
                        station.id,
                        station.nome,
                        station.tipoEstacao,
                        station.codigoAdicional || null,
                        station.codigoNomeBacia || null,
                        station.codigoNomeSubBacia || null,
                        station.nomeRio || null,
                        station.nomeEstado || null,
                        station.nomeMunicipio || null,
                        station.responsavelSigla || null,
                        station.operadoraSigla || null,
                        station.areaDrenagem || null,
                        station.latitude || null,
                        station.longitude || null,
                        station.altitude || null
                    );

                    success++;
                } catch (error) {
                    errors++;
                }
            }
        });

        transaction(data.content);

        console.log(`${stateConfig.name}: ${success} imported, ${errors} errors`);

        return {
            success: true,
            imported: success,
            errors: errors,
            state: stateConfig.name,
        };
    } catch (error) {
        console.error(`Error importing ${stateName}:`, error);
        return {
            success: false,
            error: (error as Error).message,
            state: stateName,
        };
    }
}

export async function importAllStations(db: Database.Database): Promise<ImportResult> {
    console.log(`\nStates to import: ${AVAILABLE_STATES.map((s) => s.name).join(", ")}`);

    let totalImported = 0;
    let totalErrors = 0;
    const results: ImportResult[] = [];

    for (const state of AVAILABLE_STATES) {
        const result = await importStationsFromState(db, state.name);
        results.push(result);

        if (result.success) {
            totalImported += result.imported || 0;
            totalErrors += result.errors || 0;
        }
    }

    const count = db.prepare("SELECT COUNT(*) as count FROM stations").get() as { count: number };

    console.log("\nImport Summary:");
    results.forEach((r) => {
        if (r.success) {
            console.log(`${r.state}: ${r.imported} stations`);
        } else {
            console.log(`${r.state}: ${r.error}`);
        }
    });
    console.log(`Total in database: ${count.count} stations\n`);

    return {
        success: true,
        imported: totalImported,
        errors: totalErrors,
        total: count.count,
    };
}

