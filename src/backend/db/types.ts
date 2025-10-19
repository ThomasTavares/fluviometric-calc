export interface Station {
    id: string;
    name: string;
    type: string;
    additional_code: string | null;
    basin_code: string;
    sub_basin_code: string;
    river_name: string;
    state_name: string;
    city_name: string;
    responsible_sigla: string;
    operator_sigla: string;
    drainage_area: number | null;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    created_at: Date;
}

export interface DailyStreamflow {
    id: number;
    station_id: string;
    date: Date;
    flow_rate: number | null;
    status: number | null;
    consistency_level: number;
}

export interface MonthlyStat {
    id: number;
    station_id: string;
    year: number;
    month: number;
    monthly_avg: number | null;
    monthly_max: number | null;
    monthly_min: number | null;
    valid_days: number;
}

