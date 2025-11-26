import { Station } from "../../backend/db";

export interface StartScreenProps {
    onInit: (data: Station) => void;
}