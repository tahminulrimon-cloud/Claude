import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export const getEntries = () => api.get("/entries").then((r) => r.data.entries);

export default api;
