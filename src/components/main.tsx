import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../index.css"; // نقطتين للخروج للمجلد الأعلى
import App from "./App"; // نقطتين للخروج للمجلد الأعلى

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
