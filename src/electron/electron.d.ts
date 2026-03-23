import type { BackendAPI } from '../electron/preload';

declare global {
    interface Window {
        backendApi: BackendAPI;
    }
}

export {};
