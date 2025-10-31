function Home({ onSelectView }) {
    const cards = [
        {
            id: "percentile",
            title: "Percentile Analysis",
            description: "Calculate Q95, Q90 and flow duration curves using Weibull method",
        },
        {
            id: "stations",
            title: "Station Management",
            description: "Search and filter hydrometric stations",
        },
        {
            id: "streamflow",
            title: "Flow Data Analysis",
            description: "Export data and analyze completeness",
        },
        {
            id: "q710",
            title: "Q7,10 Analysis",
            description: "Calculate 7-day low flow with 10-year return period",
        },
        {
            id: "preprocessing",
            title: "Data Preprocessing",
            description: "Configure failure threshold and filter null/zero values",
        },
    ];

    return (
        <div className="home-container">
            <div className="home-header">
                <h1>Hydrological Analysis System - ANA</h1>
                <p>Select a tool to start</p>
            </div>

            <div className="cards-grid">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        className="card"
                        onClick={() => onSelectView(card.id)}
                    >
                        <h2>{card.title}</h2>
                        <p>{card.description}</p>
                    </div>
                ))}
            </div>

            <footer className="home-footer">
                <p>System for ANA fluviometric data analysis</p>
            </footer>
        </div>
    );
}

export default Home;
