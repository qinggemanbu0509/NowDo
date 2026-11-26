import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { LanguageProvider } from "./interface-language.tsx";

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
);
