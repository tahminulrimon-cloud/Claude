const router = require("express").Router();
const { body, param, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const requireAuth = require("../middleware/auth");
const db = require("../db");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/entries — public
router.get("/", (req, res, next) => {
  try {
    const rows = db
      .prepare("SELECT * FROM entries ORDER BY age_in_days ASC, sort_order ASC")
      .all();
    res.json({ entries: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/entries/:id — public
router.get(
  "/:id",
  [param("id").isUUID()],
  validate,
  (req, res, next) => {
    try {
      const entry = db.prepare("SELECT * FROM entries WHERE id = ?").get(req.params.id);
      if (!entry) return res.status(404).json({ error: "Entry not found" });
      res.json({ entry });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/entries — admin only
router.post(
  "/",
  requireAuth,
  [
    body("label").trim().notEmpty().isLength({ max: 100 }),
    body("age").trim().notEmpty().isLength({ max: 50 }),
    body("date").trim().notEmpty().isLength({ max: 100 }),
    body("caption").trim().optional().isLength({ max: 500 }),
    body("milestone").trim().optional().isLength({ max: 200 }),
    body("photo").optional().isURL({ require_tld: false }),
    body("age_in_days").isInt({ min: 0 }),
    body("sort_order").optional().isInt({ min: 0 }),
  ],
  validate,
  (req, res, next) => {
    try {
      const id = uuidv4();
      const {
        label, age, date, photo = null,
        caption = null, milestone = null,
        age_in_days = 0, sort_order = 0,
      } = req.body;

      db.prepare(
        `INSERT INTO entries (id, label, age, date, photo, caption, milestone, age_in_days, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, label, age, date, photo, caption, milestone, age_in_days, sort_order);

      const entry = db.prepare("SELECT * FROM entries WHERE id = ?").get(id);
      res.status(201).json({ entry });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/entries/:id — admin only
router.put(
  "/:id",
  requireAuth,
  [
    param("id").isUUID(),
    body("label").optional().trim().notEmpty().isLength({ max: 100 }),
    body("age").optional().trim().notEmpty().isLength({ max: 50 }),
    body("date").optional().trim().notEmpty().isLength({ max: 100 }),
    body("caption").optional({ nullable: true }).trim().isLength({ max: 500 }),
    body("milestone").optional({ nullable: true }).trim().isLength({ max: 200 }),
    body("photo").optional({ nullable: true }),
    body("age_in_days").optional().isInt({ min: 0 }),
    body("sort_order").optional().isInt({ min: 0 }),
    body("featured").optional().isInt({ min: 0, max: 1 }),
  ],
  validate,
  (req, res, next) => {
    try {
      const existing = db.prepare("SELECT * FROM entries WHERE id = ?").get(req.params.id);
      if (!existing) return res.status(404).json({ error: "Entry not found" });

      const updated = { ...existing, ...req.body };
      db.prepare(
        `UPDATE entries SET label=?, age=?, date=?, photo=?, caption=?, milestone=?,
         age_in_days=?, sort_order=?, featured=? WHERE id=?`
      ).run(
        updated.label, updated.age, updated.date, updated.photo,
        updated.caption, updated.milestone, updated.age_in_days,
        updated.sort_order, updated.featured ?? 0, req.params.id
      );

      const entry = db.prepare("SELECT * FROM entries WHERE id = ?").get(req.params.id);
      res.json({ entry });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/entries/:id — admin only
router.delete(
  "/:id",
  requireAuth,
  [param("id").isUUID()],
  validate,
  (req, res, next) => {
    try {
      const existing = db.prepare("SELECT * FROM entries WHERE id = ?").get(req.params.id);
      if (!existing) return res.status(404).json({ error: "Entry not found" });

      db.prepare("DELETE FROM entries WHERE id = ?").run(req.params.id);
      res.json({ message: "Entry deleted" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
