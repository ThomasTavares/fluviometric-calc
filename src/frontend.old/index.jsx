import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error('Elemento com id "root" não encontrado no DOM.');
}
const root = createRoot(container);
root.render(<App />);