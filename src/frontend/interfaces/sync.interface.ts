export interface SyncProgress {
    windowsCompleted: number;
    totalWindows: number;
    currentWindow: string;
    recordsInserted: number;
    recordsUpdated: number;
}

export interface SyncResult {
    success: boolean;
    cancelled: boolean;
    stationId: string;
    stationCreated: boolean;
    period: { start: string; end: string };
    windows: { total: number; completed: number; failed: number };
    records: { inserted: number; updated: number };
    duration: number;
    errors: Array<{ window: string; message: string }>;
}

export interface SyncScreenProps {
    onInit: () => void;
    onBack: () => void;
}