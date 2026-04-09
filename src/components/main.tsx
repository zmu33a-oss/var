import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ".././index.css"; // تطلع من components ثم src
import App from "./app"; // هذا صحيح

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
