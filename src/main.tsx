import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { MiniWindow } from "./components/MiniWindow";
import "./styles.css";

// The desktop app loads this page with #mini for its floating window.
const isMini = window.location.hash === "#mini";
if (isMini) document.body.classList.add("mini-body", "desktop-mini");

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isMini ? <MiniWindow win={window} onClose={() => window.close()} /> : <App />}</StrictMode>,
);
