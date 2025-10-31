import { Q710Service } from "../services/calculations/q710.service";

interface DateRange {
    startDate?: string;
    endDate?: string;
    yearType?: "calendar" | "hydrological";
    hydroStartMonth?: number;
}

// NOVO: Interface para pré-processamento
interface PreprocessingConfig {
    mode?: "none" | "monthly" | "annually";
    maxFailurePercentage?: number;
}

export class Q710Controller {
    private q710Service: Q710Service;

    constructor(q710Service: Q710Service) {
        this.q710Service = q710Service;
    }

    async handleCalculateQ710(
        stationId: string,
        dateRange?: DateRange,
        preprocessingConfig?: PreprocessingConfig // NOVO
    ) {
        return this.q710Service.calculateQ710(
            stationId,
            dateRange,
            7, // windowSize padrão
            preprocessingConfig // NOVO
        );
    }
}
