// src/backend/types/preprocessing.types.ts

export type PreprocessingMode = "none" | "monthly" | "annually";

// Interface COMPLETA usada pela utility (com stationId)
export interface PreprocessingConfig {
    stationId: string;
    startDate?: string;
    endDate?: string;
    mode: PreprocessingMode;
    maxFailurePercentage?: number;
}

// Interface PARCIAL usada pelos controllers/routes (sem stationId)
export interface PreprocessingOptions {
    mode?: PreprocessingMode;
    maxFailurePercentage?: number;
}

export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
