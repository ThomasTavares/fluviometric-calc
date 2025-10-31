import { PreprocessingService } from "../services/preprocessing.service";
import { PreprocessingConfig } from "../types/preprocessing.types"; // ✅ Import necessário

export class PreprocessingController {
    private service: PreprocessingService;

    constructor(service: PreprocessingService) {
        this.service = service;
    }

    analyze(params: PreprocessingConfig) {
        // ✅ Usando a interface correta
        return this.service.analyzeForVisualization(params);
    }
}
