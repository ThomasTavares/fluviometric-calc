import Database from "better-sqlite3";

interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export function safeDbQueryAll<T>(
    db: Database.Database,
    query: string,
    params: any[] = [],
    errorContext: string = "database query"
): ServiceResponse<T[]> {
    try {
        const stmt = db.prepare(query);
        const result = stmt.all(...params) as T[];

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error(`Error in ${errorContext}:`, error);
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}

export function safeDbQueryGet<T>(
    db: Database.Database,
    query: string,
    params: any[] = [],
    errorContext: string = "database query"
): ServiceResponse<T> {
    try {
        const stmt = db.prepare(query);
        const result = stmt.get(...params) as T | undefined;

        if (!result) {
            return {
                success: false,
                error: "No results found",
            };
        }

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error(`Error in ${errorContext}:`, error);
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}

export function safeDbRun(
    db: Database.Database,
    query: string,
    params: any[] = [],
    errorContext: string = "database operation"
): ServiceResponse<Database.RunResult> {
    try {
        const stmt = db.prepare(query);
        const result = stmt.run(...params);

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error(`Error in ${errorContext}:`, error);
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}

export function safeDbOperation<T>(
    operation: () => T,
    errorContext: string = "database operation"
): ServiceResponse<T> {
    try {
        const result = operation();

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error(`Error in ${errorContext}:`, error);
        return {
            success: false,
            error: (error as Error).message,
        };
    }
}