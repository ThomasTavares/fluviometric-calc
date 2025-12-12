import axios, { AxiosInstance, AxiosError } from 'axios';

export interface AuthCredentials {
    cpf: string;
    password: string;
}

export interface AuthResult {
    success: boolean;
    token?: string;
    validade?: string;
    error?: string;
}

export interface DateWindow {
    start: string;
    end: string;
}

export interface StreamflowAPIResponse {
    status: string;
    code: number;
    message: string;
    items: any[];
}

export interface FetchResult {
    success: boolean;
    data?: any[];
    error?: string;
}

const ANA_BASE_URL = 'https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas';
const AUTH_ENDPOINT = `${ANA_BASE_URL}/OAUth/v1`;
const STREAMFLOW_ENDPOINT = `${ANA_BASE_URL}/HidroSerieVazao/v1`;

const REQUEST_TIMEOUT = 120000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export class ANAApiService {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            timeout: REQUEST_TIMEOUT,
            headers: {
                'accept': '*/*',
            },
        });
    }

    async authenticate(cpf: string, password: string): Promise<AuthResult> {
        try {
            const response = await this.axiosInstance.get(AUTH_ENDPOINT, {
                headers: {
                    'Identificador': cpf,
                    'Senha': password,
                },
            });

            if (response.data?.items?.tokenautenticacao) {
                return {
                    success: true,
                    token: response.data.items.tokenautenticacao,
                    validade: response.data.items.validade,
                };
            }

            return {
                success: false,
                error: 'Resposta de autenticação inválida',
            };
        } catch (err) {
            return {
                success: false,
                error: this.extractErrorMessage(err),
            };
        }
    }

    async fetchStreamflowData(
        stationCode: string,
        startDate: string,
        endDate: string,
        token: string
    ): Promise<FetchResult> {
        let lastError: string | undefined;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await this.axiosInstance.get<StreamflowAPIResponse>(
                    STREAMFLOW_ENDPOINT,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                        params: {
                            'Código da Estação': stationCode,
                            'Tipo Filtro Data': 'DATA_LEITURA',
                            'Data Inicial (yyyy-MM-dd)': startDate,
                            'Data Final (yyyy-MM-dd)': endDate,
                            'Horário Inicial (00:00:00)': '00:00:00',
                            'Horário Final (23:59:59)': '23:59:59',
                        },
                    }
                );

                if (response.data?.items && Array.isArray(response.data.items)) {
                    return {
                        success: true,
                        data: response.data.items,
                    };
                }

                return {
                    success: false,
                    error: 'Resposta da API não contém items válidos',
                };
            } catch (err) {
                lastError = this.extractErrorMessage(err);
                
                if (!this.shouldRetry(err, attempt)) {
                    break;
                }

                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                await this.sleep(delay);
            }
        }

        return {
            success: false,
            error: lastError || 'Erro desconhecido ao buscar dados',
        };
    }

    splitIntoAnnualWindows(startDate: string, endDate: string): DateWindow[] {
        const windows: DateWindow[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            throw new Error('Data inicial é posterior à data final');
        }

        const startYear = start.getFullYear();
        const endYear = end.getFullYear();

        for (let year = startYear; year <= endYear; year++) {
            let windowStart = new Date(year, 0, 1);
            let windowEnd = new Date(year, 11, 31);

            if (year === startYear && start > windowStart) {
                windowStart = start;
            }

            if (year === endYear && end < windowEnd) {
                windowEnd = end;
            }

            windows.push({
                start: this.formatDate(windowStart),
                end: this.formatDate(windowEnd),
            });
        }

        return windows;
    }

    private shouldRetry(err: unknown, attempt: number): boolean {
        if (attempt >= MAX_RETRIES) {
            return false;
        }

        if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            
            if (status === 429) return true;
            if (status && status >= 500 && status < 600) return true;
            if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') return true;
        }

        return false;
    }

    private extractErrorMessage(err: unknown): string {
        if (axios.isAxiosError(err)) {
            const axiosError = err as AxiosError;
            
            if (axiosError.response?.status === 401) {
                return 'Credenciais inválidas';
            }
            
            if (axiosError.response?.status === 429) {
                return 'Limite de requisições excedido';
            }

            if (axiosError.response?.data) {
                const data = axiosError.response.data as any;
                if (data.message) return data.message;
            }

            if (axiosError.message) {
                return axiosError.message;
            }
        }

        if (err instanceof Error) {
            return err.message;
        }

        return 'Erro desconhecido';
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
