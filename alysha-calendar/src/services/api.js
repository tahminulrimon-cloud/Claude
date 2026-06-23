import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export const getEntries = () => api.get("/entries").then((r) => r.data.entries);

export const generateCaption = (entry) =>
  api
    .post("/generate-caption", {
      photo: entry.photo,
      label: entry.label,
      age: entry.age,
      date: entry.date,
      milestone: entry.milestone,
      location: entry.location,
    }, { timeout: 30000 })
    .then((r) => r.data.caption);

export default api;
