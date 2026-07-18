import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../styles/global.css";
import "./demo.css";
import "./utilities.css";

import { App } from "./App";
import { AppProvider } from "./state/store";

const root = document.querySelector<HTMLDivElement>("#root");
if (!root) throw new Error("Workbench root element was not found.");

createRoot(root).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
