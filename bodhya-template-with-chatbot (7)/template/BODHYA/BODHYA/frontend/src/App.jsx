import { BrowserRouter } from "react-router-dom";
import AppShell from "./features/app-shell/index.jsx";

// Each feature owns one page — import your page component here and add
// a route. Keep this file small; build the actual feature inside
// src/features/<your-feature>/.
//
// The AppShell provides the tabbed interface (features/app-shell) and
// mounts the Bodhya guide chatbot (features/chatbot) which gives the
// guided tab-to-tab tour.

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
