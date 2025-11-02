interface StationData {
    id: string;
    name: string;
    type: string;
    additional_code?: string | null;
    basin_code?: string;
    sub_basin_code?: string;
    river_name?: string;
    state_name?: string;
    city_name?: string;
    responsible_sigla?: string;
    operator_sigla?: string;

    drainage_area?: number | null;
    latitude: number;
    longitude: number;
    altitude?: number | null;
    
    start_date?: string;
    end_date?: string;
}

export default StationData;