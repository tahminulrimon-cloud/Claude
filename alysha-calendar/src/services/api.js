import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export const getEntries = () => api.get("/entries").then((r) => r.data.entries);

export const updateEntry = (id, data) =>
  api.put(`/entries/${id}`, data).then((r) => r.data.entry);

export const analyzeMood = (photo) =>
  api
    .post("/analyze-mood", { photo }, { timeout: 20000 })
    .then((r) => r.data.mood);

export default api;
