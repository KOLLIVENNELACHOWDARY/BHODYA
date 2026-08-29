// ---------- Error boundary: shows a readable error instead of a blank white page ----------
import React from "react";

import { avatarImg } from "../features/chatbot/data/avatars.js";
function readAvatar() {
  try {
    const raw = window.localStorage.getItem("bodhya_v1");
    if (!raw) return null;
    return avatarImg(JSON.parse(raw).profile?.avatar) || null;
  } catch { return null; }
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", padding: 20, fontFamily: "system-ui, sans-serif" }}>
          <div style={{ maxWidth: 560, background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}>
            {readAvatar() ? (
  <img src={readAvatar()} alt="Bodhya" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", marginBottom: 8 }} />
) : (
  <div style={{ fontSize: 40, marginBottom: 8 }}>🌳</div>
)}
            <h2 style={{ margin: "0 0 8px", color: "#1e293b", fontSize: 20 }}>Bodhya hit a bump — but it's fixable!</h2>
            <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
              Something went wrong while loading. This usually means the app needs a quick restart:
            </p>
            <ol style={{ color: "#334155", fontSize: 14, lineHeight: 1.9, margin: "0 0 16px", paddingLeft: 20 }}>
              <li>Stop the server (press <b>Ctrl + C</b> in the cmd window)</li>
              <li>Run <b>npm run dev</b> again</li>
              <li>Refresh the browser with <b>Ctrl + Shift + R</b></li>
            </ol>
            <pre style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, fontSize: 12, color: "#b91c1c", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
