require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const entriesRoutes = require("./routes/entries");
const uploadRoutes = require("./routes/upload");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === "production";

// ── Security ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images from /uploads
  })
);

app.use(
  cors({
    origin: isProd ? false : ["http://localhost:5173", "http://localhost:4173"],
    credentials: true,
  })
);

// ── Rate limiting ──────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

// ── Parsing ────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ────────────────────────────────────────────────
app.use(morgan(isProd ? "combined" : "dev"));

// ── Static uploads ────────────────────────────────────────
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    maxAge: "1d",
    etag: true,
  })
);

// ── Routes ────────────────────────────────────────────────
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/upload", uploadRoutes);

// ── Health check ──────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Error handler ─────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌸  Alysha Calendar API`);
  console.log(`    http://localhost:${PORT}/api/health\n`);
  // Auto-seed on first boot
  require("./seed");
});

module.exports = app;
