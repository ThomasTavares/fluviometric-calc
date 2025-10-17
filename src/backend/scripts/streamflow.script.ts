import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { app } from "electron";

interface StreamflowJSON {
    Data_Hora_Dado: string;
    Data_Ultima_Alteracao: string;
    Dia_Maxima: string | null;
    Dia_Minima: string | null;
    Maxima: string | null;
    Maxima_Status: string | null;
    Media: string | null;
    Media_Anual: string | null;
    Media_Anual_Status: string | null;
    Media_Status: string | null;
    Mediadiaria: string | null;
    Metodo_Obtencao_Vazoes: string | null;
    Minima: string | null;
    Minima_Status: string | null;
    Nivel_Consistencia: string | null;
    Vazao_01: string | null;
    Vazao_01_Status: string | null;
    Vazao_02: string | null;
    Vazao_02_Status: string | null;
    Vazao_03: string | null;
    Vazao_03_Status: string | null;
    Vazao_04: string | null;
    Vazao_04_Status: string | null;
    Vazao_05: string | null;
    Vazao_05_Status: string | null;
    Vazao_06: string | null;
    Vazao_06_Status: string | null;
    Vazao_07: string | null;
    Vazao_07_Status: string | null;
    Vazao_08: string | null;
    Vazao_08_Status: string | null;
    Vazao_09: string | null;
    Vazao_09_Status: string | null;
    Vazao_10: string | null;
    Vazao_10_Status: string | null;
    Vazao_11: string | null;
    Vazao_11_Status: string | null;
    Vazao_12: string | null;
    Vazao_12_Status: string | null;
    Vazao_13: string | null;
    Vazao_13_Status: string | null;
    Vazao_14: string | null;
    Vazao_14_Status: string | null;
    Vazao_15: string | null;
    Vazao_15_Status: string | null;
    Vazao_16: string | null;
    Vazao_16_Status: string | null;
    Vazao_17: string | null;
    Vazao_17_Status: string | null;
    Vazao_18: string | null;
    Vazao_18_Status: string | null;
    Vazao_19: string | null;
    Vazao_19_Status: string | null;
    Vazao_20: string | null;
    Vazao_20_Status: string | null;
    Vazao_21: string | null;
    Vazao_21_Status: string | null;
    Vazao_22: string | null;
    Vazao_22_Status: string | null;
    Vazao_23: string | null;
    Vazao_23_Status: string | null;
    Vazao_24: string | null;
    Vazao_24_Status: string | null;
    Vazao_25: string | null;
    Vazao_25_Status: string | null;
    Vazao_26: string | null;
    Vazao_26_Status: string | null;
    Vazao_27: string | null;
    Vazao_27_Status: string | null;
    Vazao_28: string | null;
    Vazao_28_Status: string | null;
    Vazao_29: string | null;
    Vazao_29_Status: string | null;
    Vazao_30: string | null;
    Vazao_30_Status: string | null;
    Vazao_31: string | null;
    Vazao_31_Status: string | null;
    codigoestacao: string;
}

interface RootObject {
    codigo_estacao: string;
    items: StreamflowJSON[];
}

interface ImportResult {
    success: boolean;
    imported?: number;
    errors?: number;
    skipped?: number;
    total?: number;
    error?: string;
    stationId?: string;
    dailyRecords?: number;
    monthlyRecords?: number;
}

const AVAILABLE_STATES = [
    {
        name: "santa-catarina",
    },
    {
        name: "rio-grande-do-sul",
    },
];

function parseDate(dateString: string): { year: number; month: number; day: number; isoDate: string } {
    const date = new Date(dateString);
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        isoDate: date.toISOString().split("T")[0],
    };
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

async function importStreamflowFromFile(
    db: Database.Database,
    filePath: string,
    stationId: string
): Promise<ImportResult> {
    console.log(`\nProcessing file: ${path.basename(filePath)}`);
    console.log(`     Station ID: ${stationId}`);

    try {
        const stationExists = db.prepare("SELECT id FROM stations WHERE id = ?").get(stationId);

        if (!stationExists) {
            console.log(`     Station ${stationId} NOT FOUND in database - SKIPPING`);
            return {
                success: false,
                error: `Station ${stationId} not found`,
                stationId: stationId,
            };
        }

        console.log(`      Station found in database`);

        const rawData = fs.readFileSync(filePath, "utf-8");
        const data: RootObject = JSON.parse(rawData);

        console.log(`      JSON Structure:`);
        console.log(`        - codigo_estacao: ${data.codigo_estacao}`);
        console.log(`        - items array: ${data.items ? data.items.length : 0} records`);

        if (!data.items || !Array.isArray(data.items)) {
            throw new Error("Invalid JSON structure - expected {codigo_estacao, items: [...]}");
        }

        if (data.items.length === 0) {
            console.log(`       No monthly records found in file`);
            return {
                success: true,
                imported: 0,
                errors: 0,
                stationId: stationId,
                dailyRecords: 0,
                monthlyRecords: 0,
            };
        }

        console.log(`      Processing ${data.items.length} monthly records...`);

        const insertDaily = db.prepare(`
            INSERT OR REPLACE INTO daily_Streamflows (
                station_id, date, flow_rate, status, consistency_level
            ) VALUES (?, ?, ?, ?, ?)
        `);

        const insertMonthly = db.prepare(`
            INSERT OR REPLACE INTO monthly_stats (
                station_id, year, month, monthly_avg, monthly_max, monthly_min, valid_days
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        let dailyImported = 0;
        let monthlyImported = 0;
        let errors = 0;

        const transaction = db.transaction((items: StreamflowJSON[]) => {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                try {
                    const { year, month } = parseDate(item.Data_Hora_Dado);
                    const daysInMonth = getDaysInMonth(year, month);
                    let invalidDays = 0;

                    for (let day = 1; day <= daysInMonth; day++) {
                        const vazaoKey = `Vazao_${day.toString().padStart(2, "0")}` as keyof StreamflowJSON;
                        const statusKey = `${vazaoKey}_Status` as keyof StreamflowJSON;

                        const flowRate = item[vazaoKey];
                        const status = item[statusKey];

                        if (flowRate === null || flowRate === "0" || flowRate === "0.0") {
                            invalidDays++;
                        }

                        const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                        const consistencyLevel = item.Nivel_Consistencia ? parseInt(item.Nivel_Consistencia) : null;

                        insertDaily.run(
                            stationId,
                            dateStr,
                            flowRate,
                            status ? parseInt(status) : null,
                            consistencyLevel
                        );

                        dailyImported++;
                    }

                    const monthlyAvg = item.Media;
                    const monthlyMax = item.Maxima;
                    const monthlyMin = item.Minima;

                    insertMonthly.run(
                        stationId,
                        year,
                        month,
                        monthlyAvg,
                        monthlyMax,
                        monthlyMin,
                        invalidDays
                    );

                    monthlyImported++;
                } catch (error) {
                    console.error(`       Error processing monthly record ${i + 1}:`, (error as Error).message);
                    errors++;
                }
            }
        });

        transaction(data.items);

        console.log(`      Import completed:`);
        console.log(`        - Daily records: ${dailyImported}`);
        console.log(`        - Monthly records: ${monthlyImported}`);
        console.log(`        - Errors: ${errors}`);

        return {
            success: true,
            imported: dailyImported + monthlyImported,
            errors: errors,
            stationId: stationId,
            dailyRecords: dailyImported,
            monthlyRecords: monthlyImported,
        };
    } catch (error) {
        console.error(`      ERROR importing file:`, (error as Error).message);
        console.error(`        Stack:`, (error as Error).stack);
        return {
            success: false,
            error: (error as Error).message,
            stationId: stationId,
        };
    }
}

async function importStreamflowFromState(db: Database.Database, stateName: string): Promise<ImportResult> {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`  STATE: ${stateName.toUpperCase()}`);
    console.log(`${"=".repeat(60)}`);

    try {
        const stateConfig = AVAILABLE_STATES.find((s) => s.name === stateName);

        if (!stateConfig) {
            throw new Error(`State '${stateName}' not configured`);
        }

        const streamflowDir = path.join(process.cwd(), "src", "data", stateName, "dados-vazoes");

        console.log(` Directory: ${streamflowDir}`);
        console.log(` Directory exists: ${fs.existsSync(streamflowDir)}`);

        if (!fs.existsSync(streamflowDir)) {
            console.log(`Streamflow directory NOT FOUND`);
            throw new Error(`Streamflow directory not found: ${streamflowDir}`);
        }

        const allFiles = fs.readdirSync(streamflowDir);
        console.log(` Total files in directory: ${allFiles.length}`);
        console.log(`   Files: ${allFiles.slice(0, 5).join(", ")}${allFiles.length > 5 ? "..." : ""}`);

        const jsonFiles = allFiles.filter((file) => file.endsWith(".json"));
        console.log(` JSON files found: ${jsonFiles.length}`);

        if (jsonFiles.length === 0) {
            console.log(`  No JSON files found in ${streamflowDir}`);
            return {
                success: true,
                imported: 0,
                errors: 0,
                skipped: 0,
            };
        }

        let totalDailyImported = 0;
        let totalMonthlyImported = 0;
        let totalErrors = 0;
        let totalSkipped = 0;
        let successfulFiles = 0;

        for (let i = 0; i < jsonFiles.length; i++) {
            const file = jsonFiles[i];
            console.log(`\n[${i + 1}/${jsonFiles.length}] Processing: ${file}`);

            const filePath = path.join(streamflowDir, file);
            const stationId = file.replace(".json", "");

            const result = await importStreamflowFromFile(db, filePath, stationId);

            if (result.success) {
                totalDailyImported += result.dailyRecords || 0;
                totalMonthlyImported += result.monthlyRecords || 0;
                totalErrors += result.errors || 0;
                successfulFiles++;
            } else {
                totalSkipped++;
            }
        }

        console.log(`\n${"=".repeat(60)}`);
        console.log(` ${stateName.toUpperCase()} - SUMMARY`);
        console.log(`${"=".repeat(60)}`);
        console.log(`Total files found:        ${jsonFiles.length}`);
        console.log(`Successfully processed:   ${successfulFiles}`);
        console.log(`Skipped (station not found): ${totalSkipped}`);
        console.log(`Daily records imported:   ${totalDailyImported}`);
        console.log(`Monthly records imported: ${totalMonthlyImported}`);
        console.log(`Total errors:             ${totalErrors}`);
        console.log(`${"=".repeat(60)}`);

        return {
            success: true,
            imported: totalDailyImported + totalMonthlyImported,
            errors: totalErrors,
            skipped: totalSkipped,
            total: jsonFiles.length,
        };
    } catch (error) {
        console.error(`\CRITICAL ERROR importing streamflow from ${stateName}:`);
        console.error(`   Message: ${(error as Error).message}`);
        console.error(`   Stack: ${(error as Error).stack}`);
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}

export async function importAllStreamflow(db: Database.Database): Promise<ImportResult> {
    console.log(`\n${"#".repeat(60)}`);
    console.log(` STREAMFLOW DATA IMPORT - STARTING`);
    console.log(`${"#".repeat(60)}`);
    console.log(`States configured: ${AVAILABLE_STATES.map((s) => s.name).join(", ")}`);

    let totalImported = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    const results: ImportResult[] = [];

    for (const state of AVAILABLE_STATES) {
        const result = await importStreamflowFromState(db, state.name);
        results.push(result);

        if (result.success) {
            totalImported += result.imported || 0;
            totalErrors += result.errors || 0;
            totalSkipped += result.skipped || 0;
        }
    }

    const dailyCount = db.prepare("SELECT COUNT(*) as count FROM daily_Streamflows").get() as { count: number };
    const monthlyCount = db.prepare("SELECT COUNT(*) as count FROM monthly_stats").get() as { count: number };

    console.log(`\n${"#".repeat(60)}`);
    console.log(` GLOBAL IMPORT SUMMARY`);
    console.log(`${"#".repeat(60)}`);
    console.log(`Total records imported this run: ${totalImported}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Total files skipped: ${totalSkipped}`);
    console.log(`---`);
    console.log(` DATABASE TOTALS:`);
    console.log(`   Daily records in DB:   ${dailyCount.count}`);
    console.log(`   Monthly records in DB: ${monthlyCount.count}`);
    console.log(`${"#".repeat(60)}\n`);

    return {
        success: true,
        imported: totalImported,
        errors: totalErrors,
        skipped: totalSkipped,
        total: dailyCount.count + monthlyCount.count,
    };
}