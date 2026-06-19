import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("alysha_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 clear stale token
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) localStorage.removeItem("alysha_token");
    return Promise.reject(err);
  }
);

// ── Entries ────────────────────────────────────────────────
export const getEntries    = ()       => api.get("/entries").then((r) => r.data.entries);
export const getEntry      = (id)     => api.get(`/entries/${id}`).then((r) => r.data.entry);
export const createEntry   = (data)   => api.post("/entries", data).then((r) => r.data.entry);
export const updateEntry   = (id, d)  => api.put(`/entries/${id}`, d).then((r) => r.data.entry);
export const deleteEntry   = (id)     => api.delete(`/entries/${id}`);

// ── Auth ───────────────────────────────────────────────────
export const login         = (email, password) =>
  api.post("/auth/login", { email, password }).then((r) => r.data);
export const getMe         = () => api.get("/auth/me").then((r) => r.data.user);

// ── Upload ─────────────────────────────────────────────────
export const uploadPhoto   = (file) => {
  const fd = new FormData();
  fd.append("photo", file);
  return api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data.url);
};

export default api;
