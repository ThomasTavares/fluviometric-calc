import { MainScreenProps } from "./main.interface";

export default interface SideBarProps {
    mainScreenProps: MainScreenProps;
    open: boolean;
    onClose: () => void;
}