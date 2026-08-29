import axios from "axios";

// Thin wrapper around the FastAPI "AI service". Each feature's api file
// (e.g. features/tutor-chat/api.js) should import this instead of
// creating its own axios instance.
export const backend = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});
