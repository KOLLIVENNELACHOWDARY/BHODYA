import { BrowserRouter } from "react-router-dom";
import AppShell from "./features/app-shell/index.jsx";
import NotificationsHost from "./features/notifications/NotificationsHost.jsx";

// Each feature owns one page — import your page component here and add
// a route. Keep this file small; build the actual feature inside
// src/features/<your-feature>/.
//
// The AppShell provides the tabbed interface (features/app-shell) and
// mounts the Bodhya guide chatbot (features/chatbot) which gives the
// guided tab-to-tab tour.

export default function App() {
  // When a guardian opens a shared link the app is a read-only report.
  // The scheduler never starts and no alarm/toast can surface the student's
  // private data in the guardian's browser.
  const guestToken = typeof window !== "undefined"
    ? (window.location.hash.match(/guardian-view=([A-Za-z0-9_-]+)/) || [])[1] || null
    : null;

  return (
    <BrowserRouter>
      {/* Runs the reminder/alarm scheduler + global ring screen & toasts */}
      {!guestToken && <NotificationsHost />}
      <AppShell />
    </BrowserRouter>
  );
}
