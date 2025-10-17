import { useState } from "react";
import Home from "./components/ui/pages/Home";
import PercentileComparison from "./components/ui/pages/PercentileComparation";
import StationTest from "./components/ui/pages/StationTest";
import StreamflowTest from "./components/ui/pages/StreamflowTest";
import Q710Analysis from "./components/ui/pages/q710Analysis";

function App() {
    const [currentView, setCurrentView] = useState("home");

    const renderView = () => {
        switch (currentView) {
            case "percentile":
                return <PercentileComparison onBack={() => setCurrentView("home")} />;
            case "stations":
                return <StationTest onBack={() => setCurrentView("home")} />;
            case "streamflow":
                return <StreamflowTest onBack={() => setCurrentView("home")} />;
            case "q710":
                return <Q710Analysis onBack={() => setCurrentView("home")} />;
            case "home":
            default:
                return <Home onSelectView={setCurrentView} />;
        }
    };

    return <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>{renderView()}</div>;
}

export default App;
