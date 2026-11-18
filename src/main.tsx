import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Catch the browser's install prompt as early as possible, before React mounts.
import "./lib/install";
import { startAnalytics } from "./lib/analytics";

startAnalytics();
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
