import { MainScreenProps } from "./MainInterface";

export default interface SideBarProps {
    mainScreenProps: MainScreenProps;
    open: boolean;
    onClose: () => void;
}